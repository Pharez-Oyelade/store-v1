"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { QuickViewModal } from "./QuickViewModal";

interface SinglePageCatalogSectionProps {
  handle: string;
  vendorName: string;
  products: any[];
  accentColor?: string;
  isMultiPageTier?: boolean;
}

export function SinglePageCatalogSection({
  handle,
  vendorName,
  products,
  accentColor = "#E11D48",
  isMultiPageTier = false,
}: SinglePageCatalogSectionProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  return (
    <section id="products-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
            {isMultiPageTier ? "Featured Release" : "Collection & Pieces"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950">
            {isMultiPageTier ? "Latest Pieces" : "Available Pieces"}
          </h2>
        </div>

        {isMultiPageTier && products.length > 8 && (
          <Link
            href={`/store/${handle}/products`}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors"
          >
            <span>View all {products.length} pieces</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="size-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/60">
            <Package size={28} />
          </div>
          <h3 className="text-lg font-serif font-bold text-gray-950">
            New Collection Coming Soon
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            {vendorName} is currently crafting new pieces. Submit a bespoke request or contact the designer directly on WhatsApp!
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
          {products.map((product) => {
            const primaryImage = product.images?.[0]?.url;
            const price = product.basePrice || product.variants?.[0]?.price || 0;
            const hasMultipleVariants = (product.variants?.length || 0) > 1;

            // On Multi-page tier (Drape+), cards link directly to /product/:id
            // On Single-page tier (Free/Stitch), clicking card opens QuickView modal right here!
            if (isMultiPageTier) {
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
            }

            return (
              <div
                key={product._id}
                onClick={() => setQuickViewProduct(product)}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-400 transition-all duration-200 flex flex-col cursor-pointer"
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
                      <span>Quick View</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Modal for Single-Page Storefronts */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          handle={handle}
          accentColor={accentColor}
          onClose={() => setQuickViewProduct(null)}
          onOpenCheckout={() => {
            window.location.href = `/store/${handle}/checkout`;
          }}
        />
      )}
    </section>
  );
}
