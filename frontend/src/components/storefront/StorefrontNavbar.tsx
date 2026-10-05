"use client";

import Link from "next/link";
import { ShoppingBag, Sparkles, Scissors } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function StorefrontNavbar({ vendor }: { vendor: any }) {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartMounted = useCartStore((state) => state.items !== undefined);

  const logoUrl = vendor?.logo?.url || (typeof vendor?.logo === "string" ? vendor.logo : null);
  const businessType = vendor?.businessType || "hybrid"; // default to hybrid if not set

  const showCart = businessType === "ready_to_wear" || businessType === "hybrid";
  const showCustomRequest = businessType === "demand" || businessType === "hybrid";

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo or Store Name */}
          <div className="flex items-center">
            <Link
              href={`/store/${vendor.handle}`}
              className="flex items-center gap-3 group"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={vendor.businessName}
                  className="h-9 sm:h-11 w-auto max-w-[140px] sm:max-w-[200px] object-contain rounded-md"
                />
              ) : (
                <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-gray-950 group-hover:text-brand-900 transition-colors">
                  {vendor.businessName}
                </span>
              )}
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Custom Request Icon / CTA for Bespoke & Hybrid */}
            {showCustomRequest && (
              <Link
                href={`/store/${vendor.handle}/request`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 text-stone-800 hover:border-brand-700 hover:text-brand-800 hover:bg-brand-50/50 transition-all duration-150 active:scale-98 shadow-2xs"
                title="Request Bespoke Garment Design"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span className="hidden sm:inline">Custom Request</span>
              </Link>
            )}

            {/* Shopping Cart Icon for RTW & Hybrid */}
            {showCart && (
              <Link
                href={`/store/${vendor.handle}/checkout`}
                className="relative p-2.5 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                {cartMounted && totalItems > 0 && (
                  <span
                    className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 rounded-full shadow-xs"
                    style={{
                      backgroundColor:
                        vendor?.storefrontSettings?.accentColor || "#E11D48",
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
