"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface CategorySummary {
  name: string;
  count: number;
  imageUrl?: string;
}

interface CategoryCardsSectionProps {
  handle: string;
  categories: CategorySummary[];
}

export function CategoryCardsSection({
  handle,
  categories,
}: CategoryCardsSectionProps) {
  if (!categories || categories.length === 0) return null;

  // Show up to 4 featured category cards
  const displayCategories = categories.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header with Title and "View All" on the right */}
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 block mb-1">
            Collections
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gray-950">
            Curated Categories
          </h2>
        </div>

        <Link
          href={`/store/${handle}/products`}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors"
        >
          <span>View all products</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {displayCategories.map((cat) => {
          return (
            <Link
              key={cat.name}
              href={`/store/${handle}/products?category=${encodeURIComponent(cat.name)}`}
              className="group relative aspect-3/4 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-end p-5"
            >
              {/* Background Image or Aesthetic Fallback */}
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-300">
                  <Layers className="size-12 stroke-[1.2]" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/85 transition-colors" />

              {/* Card Label */}
              <div className="relative z-10 text-white space-y-1">
                <p className="text-[11px] font-medium text-stone-300 uppercase tracking-wider">
                  {cat.count} {cat.count === 1 ? "Piece" : "Pieces"}
                </p>
                <h3 className="font-serif font-bold text-lg sm:text-xl capitalize leading-snug group-hover:text-amber-200 transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
