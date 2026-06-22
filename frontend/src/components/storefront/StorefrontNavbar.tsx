"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function StorefrontNavbar({ vendor }: { vendor: any }) {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartMounted = useCartStore((state) => state.items !== undefined); // Ensure hydration

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href={`/store/${vendor.handle}`} className="flex-shrink-0 flex items-center gap-3">
              {vendor.logo ? (
                <img src={vendor.logo} alt={vendor.businessName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                  {vendor.businessName.charAt(0)}
                </div>
              )}
              <span className="font-serif font-bold text-xl text-gray-900">{vendor.businessName}</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <Link 
              href={`/store/${vendor.handle}/checkout`}
              className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <span className="sr-only">Cart</span>
              <ShoppingBag className="h-6 w-6" />
              {cartMounted && totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
