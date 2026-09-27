"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Check } from "lucide-react";

export function ProductDetailsClient({
  product,
  handle,
}: {
  product: any;
  handle: string;
}) {
  const getVariantStock = (v: any) => v?.quantity ?? v?.stockQuantity ?? 0;

  // Extract structured options if available from product.variantOptions or infer from variants
  const optionDimensions = useMemo(() => {
    if (Array.isArray(product.variantOptions) && product.variantOptions.length > 0) {
      return product.variantOptions.filter(
        (dim: any) => Array.isArray(dim.values) && dim.values.length > 0,
      );
    }

    // Infer from variants if discrete fields are present
    const variants = product.variants || [];
    const inferred: { name: string; values: string[] }[] = [];

    const colors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean))) as string[];
    const lengths = Array.from(new Set(variants.map((v: any) => v.length).filter(Boolean))) as string[];
    const sleeves = Array.from(new Set(variants.map((v: any) => v.sleeve).filter(Boolean))) as string[];
    const fits = Array.from(new Set(variants.map((v: any) => v.fit).filter(Boolean))) as string[];

    if (colors.length > 1) inferred.push({ name: "Color", values: colors });
    if (sizes.length > 1) inferred.push({ name: "Size", values: sizes });
    if (lengths.length > 1) inferred.push({ name: "Length", values: lengths });
    if (sleeves.length > 1) inferred.push({ name: "Sleeve", values: sleeves });
    if (fits.length > 1) inferred.push({ name: "Fit", values: fits });

    return inferred;
  }, [product]);

  // Selected state for each dimension: e.g. { Color: "Emerald", Size: "M", Length: "Maxi" }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      const first = product.variants[0];
      if (first.color) initial["Color"] = first.color;
      if (first.size) initial["Size"] = first.size;
      if (first.length) initial["Length"] = first.length;
      if (first.sleeve) initial["Sleeve"] = first.sleeve;
      if (first.fit) initial["Fit"] = first.fit;
    }
    return initial;
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?._id || "",
  );

  // Sync selectedVariantId when selectedOptions change
  useEffect(() => {
    if (optionDimensions.length === 0) return;

    const matched = product.variants?.find((v: any) => {
      return optionDimensions.every((dim: any) => {
        const selectedVal = selectedOptions[dim.name];
        if (!selectedVal) return true;
        const dimKey = dim.name.toLowerCase();
        return (v[dimKey] || "").toLowerCase() === selectedVal.toLowerCase();
      });
    });

    if (matched) {
      setSelectedVariantId(matched._id);
    }
  }, [selectedOptions, optionDimensions, product.variants]);

  const selectedVariant =
    product.variants?.find((v: any) => v._id === selectedVariantId) ||
    product.variants?.[0];
  const selectedStock = getVariantStock(selectedVariant);

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    if (selectedStock <= 0) {
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

  function handleSelectDimensionValue(dimName: string, value: string) {
    setSelectedOptions((prev) => ({
      ...prev,
      [dimName]: value,
    }));
  }

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-16">
      {/* Image Gallery */}
      <div className="lg:max-w-lg lg:self-end">
        <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-100">
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
          <p className="text-3xl font-semibold tracking-tight text-brand-900">
            {formatCurrency(selectedVariant?.price || 0)}
          </p>
        </div>

        {product.category && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {product.category}
            </span>
          </div>
        )}

        <div className="mt-6">
          <h3 className="sr-only">Description</h3>
          <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          {/* MULTI-DIMENSIONAL SELECTOR (Fashion Elevated) */}
          {optionDimensions.length > 0 ? (
            <div className="space-y-5 mb-6">
              {optionDimensions.map((dim: any) => {
                const currentVal = selectedOptions[dim.name] || dim.values[0];

                return (
                  <div key={dim.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                        {dim.name}: <strong className="text-gray-950 font-bold">{currentVal}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dim.values.map((val: string) => {
                        const isSelected =
                          (currentVal || "").toLowerCase() === val.toLowerCase();

                        // Check if combination is in stock
                        const testCombination: Record<string, string> = {
                          ...selectedOptions,
                          [dim.name]: val,
                        };
                        const matchingVariant = product.variants?.find((v: any) => {
                          return optionDimensions.every((d: any) => {
                            const expectedVal = testCombination[d.name];
                            if (!expectedVal) return true;
                            const key = d.name.toLowerCase();
                            return (v[key] || "").toLowerCase() === expectedVal.toLowerCase();
                          });
                        });
                        const stock = getVariantStock(matchingVariant);
                        const isOutOfStock = matchingVariant && stock <= 0;

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectDimensionValue(dim.name, val)}
                            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-brand-700 text-white shadow-xs ring-2 ring-brand-700 ring-offset-1"
                                : isOutOfStock
                                  ? "bg-gray-100 text-gray-400 border border-gray-200 line-through opacity-60"
                                  : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Stock Status Indicator */}
              {selectedVariant && (
                <div className="pt-1">
                  {selectedStock > 0 ? (
                    <p className="text-xs font-medium text-green-700 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                      In stock ({selectedStock} available)
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-error-600">
                      Currently out of stock in this combination
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* FLAT BUTTON SELECTOR (Fallback for single-dimension or legacy) */
            product.variants &&
            product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-3">
                  Option
                </h3>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {product.variants.map((variant: any) => {
                    const stock = getVariantStock(variant);
                    const isSelected = selectedVariantId === variant._id;
                    return (
                      <button
                        key={variant._id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant._id)}
                        className={`flex items-center justify-between rounded-lg py-2.5 px-3 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-brand-700 text-white shadow-xs ring-2 ring-brand-700 ring-offset-1"
                            : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
                        } ${stock <= 0 ? "opacity-50 line-through cursor-not-allowed" : ""}`}
                        disabled={stock <= 0}
                      >
                        <span className="truncate">{variant.label}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedStock > 0 ? (
                      <span className="text-green-600 font-medium">
                        {selectedStock} in stock
                      </span>
                    ) : (
                      <span className="text-error-600 font-medium">Out of stock</span>
                    )}
                  </p>
                )}
              </div>
            )
          )}

          {/* Add to Cart Action */}
          <div className="mt-6 flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedStock <= 0}
              className="flex max-w-xs flex-1 items-center justify-center rounded-xl bg-brand-700 px-8 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-full transition-all"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {selectedStock <= 0 ? "Out of Stock" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
