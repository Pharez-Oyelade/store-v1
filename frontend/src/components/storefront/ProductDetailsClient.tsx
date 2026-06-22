"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

export function ProductDetailsClient({ product, handle }: { product: any; handle: string }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?._id || ""
  );
  
  const selectedVariant = product.variants?.find((v: any) => v._id === selectedVariantId);
  
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    if (selectedVariant.stockQuantity <= 0) {
      toast.error("This variant is currently out of stock.");
      return;
    }

    addItem({
      productId: product._id,
      variantId: selectedVariant._id,
      name: product.name,
      price: selectedVariant.price,
      quantity: 1,
      image: product.images?.[0]?.url,
      variantLabel: selectedVariant.label,
    });
    
    toast.success("Added to cart!");
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-16">
      {/* Image Gallery */}
      <div className="lg:max-w-lg lg:self-end">
        <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-xl bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-10 px-4 sm:px-0 lg:mt-0">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">
          {product.name}
        </h1>
        
        <div className="mt-3">
          <h2 className="sr-only">Product information</h2>
          <p className="text-3xl tracking-tight text-gray-900">
            {formatCurrency(selectedVariant?.price || 0)}
          </p>
        </div>

        <div className="mt-6">
          <h3 className="sr-only">Description</h3>
          <p className="text-base text-gray-700">{product.description}</p>
        </div>

        <div className="mt-10">
          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {product.variants.map((variant: any) => (
                  <button
                    key={variant._id}
                    onClick={() => setSelectedVariantId(variant._id)}
                    className={`flex items-center justify-center rounded-md py-3 px-3 text-sm font-semibold uppercase sm:flex-1 ${
                      selectedVariantId === variant._id
                        ? "bg-brand-600 text-white border-transparent"
                        : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
                    } ${variant.stockQuantity <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={variant.stockQuantity <= 0}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedVariant.stockQuantity > 0 ? (
                    <span className="text-green-600">{selectedVariant.stockQuantity} in stock</span>
                  ) : (
                    <span className="text-red-500">Out of stock</span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="mt-10 flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
              className="flex max-w-xs flex-1 items-center justify-center rounded-xl bg-brand-700 px-8 py-4 text-base font-medium text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-full transition-colors"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
