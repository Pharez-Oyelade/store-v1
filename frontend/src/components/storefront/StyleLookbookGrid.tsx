"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Scissors, Clock, ArrowRight, Eye, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface StyleItem {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  images?: { url: string; publicId: string }[];
  basePrice?: number;
  leadTimeDays?: number;
  fulfillmentType?: string;
}

interface StyleLookbookGridProps {
  handle: string;
  vendorName: string;
  styles: StyleItem[];
  accentColor?: string;
}

export function StyleLookbookGrid({
  handle,
  vendorName,
  styles,
  accentColor = "#E11D48",
}: StyleLookbookGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedStylePreview, setSelectedStylePreview] = useState<StyleItem | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    styles.forEach((s) => {
      if (s.category && s.category.trim()) set.add(s.category.trim());
    });
    return ["all", ...Array.from(set)];
  }, [styles]);

  const filteredStyles = React.useMemo(() => {
    if (activeCategory === "all") return styles;
    return styles.filter(
      (s) => (s.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [styles, activeCategory]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
            Bespoke Portfolio & Lookbook
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950">
            Signature Tailored Styles
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Select any signature style to order with your exact measurements, or bring your own design inspiration.
          </p>
        </div>

        <Link
          href={`/store/${handle}/request`}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gray-950 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>Upload Custom Design</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`py-2 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-gray-950 text-white shadow-2xs"
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {cat === "all" ? "All Styles" : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Styles */}
      {filteredStyles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center max-w-md mx-auto space-y-3">
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Scissors size={24} />
          </div>
          <h3 className="font-serif font-bold text-base text-gray-950">
            Custom Tailoring On Request
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {vendorName} creates bespoke garments tailored to your exact measurements. Share your dream design or style photos!
          </p>
          <div className="pt-2">
            <Link
              href={`/store/${handle}/request`}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gray-950 text-white text-xs font-bold"
            >
              <span>Submit Style Inspiration</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredStyles.map((style) => {
            const primaryImage = style.images?.[0]?.url;
            const requestUrl = `/store/${handle}/request?styleId=${encodeURIComponent(
              style._id
            )}&styleTitle=${encodeURIComponent(style.name)}&styleImage=${encodeURIComponent(
              primaryImage || ""
            )}`;

            return (
              <div
                key={style._id}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-400 transition-all duration-200 flex flex-col"
              >
                {/* Photo */}
                <div className="aspect-3/4 bg-stone-100 overflow-hidden relative">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={style.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      Bespoke Design
                    </div>
                  )}

                  {style.category && (
                    <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                      {style.category}
                    </span>
                  )}

                  {style.leadTimeDays ? (
                    <span className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <Clock size={11} className="text-amber-400" />
                      <span>{style.leadTimeDays} days turnaround</span>
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-gray-950 text-base group-hover:text-stone-700 transition-colors line-clamp-1">
                      {style.name}
                    </h3>
                    {style.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {style.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 space-y-2.5">
                    {style.basePrice ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-400 font-medium">
                          Making Fee From
                        </span>
                        <span className="text-sm font-bold text-gray-950">
                          {formatCurrency(style.basePrice)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-400 font-medium">
                          Pricing
                        </span>
                        <span className="text-xs font-semibold text-stone-600">
                          Quote on consultation
                        </span>
                      </div>
                    )}

                    <Link
                      href={requestUrl}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-2xs transition-all active:scale-98"
                    >
                      <Scissors size={13} className="text-amber-400" />
                      <span>Request This Style</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
