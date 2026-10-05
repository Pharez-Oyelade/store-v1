"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

interface ProductsCatalogClientProps {
  handle: string;
  initialProducts: ProductItem[];
  vendorName: string;
  initialCategory?: string;
  accentColor?: string;
}

export function ProductsCatalogClient({
  handle,
  initialProducts,
  vendorName,
  initialCategory = "all",
  accentColor = "#E11D48",
}: ProductsCatalogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  // Extract unique category names
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return ["all", ...Array.from(set)];
  }, [initialProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "all" ||
          (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const priceA = a.basePrice || a.variants?.[0]?.price || 0;
        const priceB = b.basePrice || b.variants?.[0]?.price || 0;
        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <Link
            href={`/store/${handle}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-1"
          >
            <ArrowLeft className="size-3.5" />
            Back to {vendorName}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-950">
            All Collections
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Showing {filteredProducts.length} of {initialProducts.length} pieces
          </p>
        </div>

        {/* Search input & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search pieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 w-48 sm:w-60 shadow-2xs"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-2 px-3 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-400 shadow-2xs"
          >
            <option value="newest">Latest Pieces</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? "bg-gray-950 text-white shadow-xs"
                    : "bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {cat === "all" ? "All Pieces" : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="size-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Package className="size-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-gray-900">No pieces found</h3>
          <p className="text-xs text-stone-500">
            Try resetting your search query or selecting a different category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="text-xs font-bold text-brand-700 hover:underline pt-2 inline-block"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const primaryImage = product.images?.[0]?.url;
            const price = product.basePrice || product.variants?.[0]?.price || 0;
            const hasMultipleVariants = (product.variants?.length || 0) > 1;
            const isMTO = product.fulfillmentType === "made_to_order";

            return (
              <Link
                key={product._id}
                href={`/store/${handle}/product/${product._id}`}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-400 transition-all duration-200 flex flex-col"
              >
                {/* Image */}
                <div className="aspect-3/4 bg-stone-100 overflow-hidden relative">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      No image
                    </div>
                  )}

                  {product.category && (
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                      {product.category}
                    </span>
                  )}

                  {isMTO && (
                    <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                      Made to Order
                    </span>
                  )}
                </div>

                {/* Details */}
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
    </div>
  );
}
