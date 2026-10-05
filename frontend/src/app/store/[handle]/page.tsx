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
  businessType?: "ready_to_wear" | "made_to_order" | "demand" | "hybrid";
  category?: string;
  storefrontSettings?: {
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
      <div className="min-h-screen">
        <BespokeTailorView vendor={vendor} handle={handle} />
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

      {/* ── Products Grid Showcase ────────────────────────── */}
      <section
        id="products-catalog"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
      >
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200/80">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
              {isDrapePlus ? "Featured Release" : "Catalogue"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950">
              {isDrapePlus ? "Latest Pieces" : "Available Pieces"}
            </h2>
          </div>

          {isDrapePlus && products.length > 8 && (
            <Link
              href={`/store/${handle}/products`}
              className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors"
            >
              <span>View all {products.length} pieces</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {displayProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="size-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/60">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-serif font-bold text-gray-950">
              New Collection Coming Soon
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {vendor.businessName} is currently crafting new pieces. Submit a bespoke
              request or contact the designer directly on WhatsApp!
            </p>
            <div className="pt-2">
              <Link
                href={`/store/${handle}/request`}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gray-950 text-white font-medium text-xs sm:text-sm shadow-xs"
              >
                <span>Request Custom Style</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => {
              const primaryImage = product.images?.[0]?.url;
              const price = product.basePrice || product.variants?.[0]?.price || 0;
              const hasMultipleVariants = (product.variants?.length || 0) > 1;

              return (
                <Link
                  key={product._id}
                  href={`/store/${handle}/product/${product._id}`}
                  className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-400 transition-all duration-200 flex flex-col"
                >
                  <div className="aspect-3/4 bg-stone-100 overflow-hidden relative">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                        No image available
                      </div>
                    )}
                    {product.category && (
                      <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-gray-950 text-base group-hover:text-stone-700 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">Price</span>
                        <span className="text-base font-bold text-gray-950">
                          {formatCurrency(price)}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        style={{ color: accentColor }}
                      >
                        {hasMultipleVariants ? "Select Options" : "View Piece"}
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
