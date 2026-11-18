"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, ShoppingBag, Check, ArrowRight, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useVendorCart } from "@/store/cartStore";
import toast from "react-hot-toast";

interface QuickViewModalProps {
  product: any | null;
  handle: string;
  onClose: () => void;
  accentColor?: string;
  onOpenCheckout?: () => void;
}

export function QuickViewModal({
  product,
  handle,
  onClose,
  accentColor = "#E11D48",
  onOpenCheckout,
}: QuickViewModalProps) {
  const { addItem } = useVendorCart(handle);

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const inStock = product.variants.find((v: any) => (v.quantity ?? 0) > 0);
      setSelectedVariantId(inStock ? inStock._id : product.variants[0]._id);
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const selectedVariant =
    product.variants?.find((v: any) => v._id === selectedVariantId) ||
    product.variants?.[0];
  const stock = selectedVariant?.quantity ?? 0;
  const price = selectedVariant?.price || product.basePrice || 0;

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((q) => q + 1);
    } else {
      toast.error(`Only ${stock} items available.`);
    }
  };

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    if (stock <= 0) {
      toast.error("This variant is currently out of stock.");
      return;
    }

    addItem({
      productId: product._id,
      variantId: selectedVariant._id,
      name: product.name,
      price: selectedVariant.price,
      quantity,
      image: product.images?.[activeImageIndex]?.url || product.images?.[0]?.url,
      variantLabel: selectedVariant.label,
    });

    toast.success(
      quantity > 1 ? `Added ${quantity} items to your bag!` : "Added to cart!"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-white/80 hover:bg-stone-100 text-stone-600 transition-colors shadow-2xs"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 bg-stone-100 relative min-h-[260px] md:min-h-full">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[activeImageIndex]?.url || product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover object-center max-h-[340px] md:max-h-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
              No image
            </div>
          )}

          {/* Multiple image thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5 overflow-x-auto">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`size-10 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx
                      ? "border-white ring-2 ring-stone-900"
                      : "border-white/70 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-2">
            {product.category && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${accentColor}14`,
                  color: accentColor,
                }}
              >
                {product.category}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-950">
              {product.name}
            </h2>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(price)}
            </p>
            {product.description && (
              <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed pt-1">
                {product.description}
              </p>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Select Option / Size:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariantId === v._id;
                  const vStock = v.quantity ?? 0;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() => setSelectedVariantId(v._id)}
                      disabled={vStock <= 0}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                        isSelected
                          ? "text-white shadow-2xs border-transparent"
                          : vStock <= 0
                          ? "bg-stone-50 text-stone-300 border-stone-200 line-through cursor-not-allowed"
                          : "bg-white text-stone-800 border-stone-200 hover:bg-stone-50"
                      }`}
                      style={isSelected ? { backgroundColor: accentColor } : undefined}
                    >
                      <span className="truncate">{v.label}</span>
                      {isSelected && <Check size={12} className="ml-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Stock Availability */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {stock > 0 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In stock ({stock} available)
              </span>
            ) : (
              <span className="text-rose-600 font-medium">Out of stock</span>
            )}

            {stock > 0 && (
              <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="px-2 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Decrease"
                >
                  <Minus size={12} />
                </button>
                <span className="px-2 text-xs font-bold text-gray-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= stock}
                  className="px-2 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Increase"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={stock <= 0}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingBag size={15} />
              <span>
                {stock <= 0
                  ? "Out of Stock"
                  : `Add to Cart • ${formatCurrency(price * quantity)}`}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
              >
                Keep Shopping
              </button>
              {onOpenCheckout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCheckout();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <span>Checkout</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
