import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Package,
} from "lucide-react";
import { getServerApiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { hasMinPlan } from "@/lib/subscriptionGating";
import { CategoryCardsSection } from "@/components/storefront/CategoryCardsSection";
import { TrustSignalsSection } from "@/components/storefront/TrustSignalsSection";
import { BespokeTailorView } from "@/components/storefront/BespokeTailorView";
import { StyleLookbookGrid } from "@/components/storefront/StyleLookbookGrid";
import { SinglePageCatalogSection } from "@/components/storefront/SinglePageCatalogSection";

interface VendorData {
  _id: string;
  businessName: string;
  handle: string;
  bio?: string;
  logo?: {
    url?: string;
    publicId?: string;
  };
  location?: {
    state?: string;
    city?: string;
    area?: string;
  };
  socials?: {
    instagram?: string;
    whatsapp?: string;
  };
  subscriptionPlan?: string;
  businessType?: "unselected" | "ready_to_wear" | "made_to_order" | "demand" | "hybrid";
  category?: string;
  storefrontSettings?: {
    isPublished?: boolean;
    themeColor?: string;
    accentColor?: string;
    bannerImage?: {
      url?: string;
      publicId?: string;
    };
    announcementText?: string;
    announcementActive?: boolean;
    whatsappFabEnabled?: boolean;
    featuredProductIds?: string[];
  };
}

interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  images?: { url: string; publicId: string }[];
  basePrice?: number;
  variants?: {
    _id: string;
    label: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }[];
  fulfillmentType?: "ready_to_wear" | "made_to_order" | "demand";
  leadTimeDays?: number;
  createdAt?: string;
}

async function getVendorInfo(handle: string): Promise<VendorData | null> {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/storefront/${handle}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getVendorProducts(handle: string): Promise<ProductItem[]> {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/storefront/${handle}/products?limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.products || [];
  } catch {
    return [];
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [vendor, products] = await Promise.all([
    getVendorInfo(handle),
    getVendorProducts(handle),
  ]);

  if (!vendor) {
    notFound();
  }

  const isBespokeOnly = vendor.businessType === "demand";
  const isDrapePlus = hasMinPlan(vendor.subscriptionPlan, "drape");
  const bannerUrl = vendor.storefrontSettings?.bannerImage?.url;
  const accentColor = vendor.storefrontSettings?.accentColor || "#E11D48";

  // If vendor is strictly bespoke/tailoring with no RTW products, render BespokeTailorView
  if (isBespokeOnly) {
    return (
      <div className="min-h-screen space-y-12 pb-20">
        <BespokeTailorView vendor={vendor} handle={handle} />
        <StyleLookbookGrid
          handle={handle}
          vendorName={vendor.businessName}
          styles={products}
          accentColor={accentColor}
        />
        <TrustSignalsSection />
      </div>
    );
  }

  // Group products by category for category cards
  const categoriesMap = new Map<string, { count: number; imageUrl?: string }>();
  products.forEach((p) => {
    if (p.category && p.category.trim()) {
      const cat = p.category.trim();
      const existing = categoriesMap.get(cat);
      if (existing) {
        existing.count += 1;
      } else {
        categoriesMap.set(cat, {
          count: 1,
          imageUrl: p.images?.[0]?.url,
        });
      }
    }
  });

  const categoriesList = Array.from(categoriesMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    imageUrl: data.imageUrl,
  }));

  // Determine products to showcase on landing page:
  // Stitch plan: shows all products.
  // Drape+ plan: shows latest 8-10 or featured products.
  const displayProducts = isDrapePlus ? products.slice(0, 8) : products;

  return (
    <div className="min-h-screen pb-20 space-y-12">
      {/* ── Section 1: Hero Section ────────────────────────── */}
      <section className="relative overflow-hidden bg-[#FAF8F5] border-b border-stone-200/80">
        {/* Banner Image or Warm Plain Background */}
        {bannerUrl ? (
          <div className="relative h-80 sm:h-96 md:h-[460px] w-full overflow-hidden">
            <img
              src={bannerUrl}
              alt={vendor.businessName}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white space-y-4 max-w-3xl mx-auto">
              <span className="text-xs font-semibold tracking-widest uppercase text-amber-300">
                Atelier Collection
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
                {vendor.businessName}
              </h1>
              {vendor.bio && (
                <p className="text-xs sm:text-base text-stone-200 max-w-xl line-clamp-3 leading-relaxed">
                  {vendor.bio}
                </p>
              )}
              <div className="pt-2">
                {isDrapePlus ? (
                  <Link
                    href={`/store/${handle}/products`}
                    className="inline-flex items-center gap-2 py-3 px-7 rounded-xl bg-white hover:bg-stone-100 text-gray-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98"
                  >
                    <span>Explore Full Catalog</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <a
                    href="#products-catalog"
                    className="inline-flex items-center gap-2 py-3 px-7 rounded-xl bg-white hover:bg-stone-100 text-gray-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98"
                  >
                    <span>View Collection</span>
                    <ArrowRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Plain Warm Background Hero */
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-600" />
              Fashion House & Boutique
            </span>

            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-gray-950 tracking-tight leading-tight">
              {vendor.businessName}
            </h1>

            {vendor.bio && (
              <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
                {vendor.bio}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {isDrapePlus ? (
                <Link
                  href={`/store/${handle}/products`}
                  className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <a
                  href="#products-catalog"
                  className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98"
                >
                  <span>View Collection</span>
                  <ArrowRight size={15} />
                </a>
              )}

              {vendor.businessType === "hybrid" && (
                <Link
                  href={`/store/${handle}/request`}
                  className="inline-flex items-center gap-2 py-3.5 px-6 rounded-xl border border-stone-300 hover:border-stone-800 text-stone-800 font-semibold text-xs sm:text-sm transition-all shadow-2xs"
                >
                  <Sparkles size={15} className="text-amber-500" />
                  <span>Custom Bespoke Request</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Section Ordering Based On Plan Tier ───────────── */}
      {isDrapePlus ? (
        <>
          {/* Drape+ Section 2: Category Cards */}
          <CategoryCardsSection handle={handle} categories={categoriesList} />

          {/* Drape+ Section 3: Trust Signals */}
          <TrustSignalsSection />
        </>
      ) : (
        <>
          {/* Stitch Section 2: Trust Signals */}
          <TrustSignalsSection />
        </>
      )}

      {/* ── Products Grid Showcase (Single-Page / Multi-Page Adaptive) ── */}
      <SinglePageCatalogSection
        handle={handle}
        vendorName={vendor.businessName}
        products={displayProducts}
        accentColor={accentColor}
        isMultiPageTier={isDrapePlus}
      />

      {/* ── Hybrid Model: Bespoke Lookbook Showcase ──────────── */}
      {vendor.businessType === "hybrid" && (
        <StyleLookbookGrid
          handle={handle}
          vendorName={vendor.businessName}
          styles={products.filter((p) => p.fulfillmentType === "demand")}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
