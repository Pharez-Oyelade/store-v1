"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useVendorCart } from "@/store/cartStore";
import { formatCurrency, buildWhatsAppLink } from "@/lib/utils";
import {
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageCircle,
  Ruler,
  Truck,
  ShieldCheck,
  Sparkles,
  X,
  Maximize2,
  Minus,
  Plus,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

interface Variant {
  _id: string;
  label: string;
  size?: string;
  color?: string;
  length?: string;
  fit?: string;
  sleeve?: string;
  options?: Record<string, string>;
  custom?: string;
  sku?: string;
  price: number;
  quantity?: number;
  stockQuantity?: number;
}

interface Dimension {
  name: string;
  values: string[];
}

interface ProductDetailsClientProps {
  product: any;
  vendor?: any;
  handle: string;
}

// Nigerian standard ready-to-wear sizing table
const SIZE_GUIDE_CHART = [
  { size: "UK 6 / XS", bust: "31 - 32", waist: "24 - 25", hips: "34 - 35" },
  { size: "UK 8 / S", bust: "33 - 34", waist: "26 - 27", hips: "36 - 37" },
  { size: "UK 10 / M", bust: "35 - 36", waist: "28 - 29", hips: "38 - 39" },
  { size: "UK 12 / L", bust: "37 - 38", waist: "30 - 31", hips: "40 - 41" },
  { size: "UK 14 / XL", bust: "39 - 41", waist: "32 - 34", hips: "42 - 44" },
  { size: "UK 16 / 2XL", bust: "42 - 44", waist: "35 - 37", hips: "45 - 47" },
  { size: "UK 18 / 3XL", bust: "45 - 47", waist: "38 - 40", hips: "48 - 50" },
  { size: "UK 20 / 4XL", bust: "48 - 50", waist: "41 - 43", hips: "51 - 53" },
];

export function ProductDetailsClient({
  product,
  vendor,
  handle,
}: ProductDetailsClientProps) {
  const accentColor = vendor?.accentColor || "#E11D48";
  const themeColor = vendor?.themeColor || "#C88A2C";
  const businessName = vendor?.businessName || "Official Store";
  const whatsappPhone = vendor?.whatsapp || vendor?.phone || "";
  const deliveryRates = vendor?.deliveryRates || [];

  const variants: Variant[] = useMemo(() => {
    return Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants
      : [
          {
            _id: product?._id || "default",
            label: "Default",
            price: product?.basePrice || 0,
            quantity: 99,
          },
        ];
  }, [product]);

  const getVariantStock = (v?: Variant | null): number => {
    if (!v) return 0;
    return v.quantity ?? v.stockQuantity ?? 0;
  };

  /* ──────────────────────────────────────────────────────────────────
   * 1. Smart Dimension Extraction Engine
   * ────────────────────────────────────────────────────────────────── */
  const optionDimensions: Dimension[] = useMemo(() => {
    // If explicitly provided via product.variantOptions
    if (
      Array.isArray(product.variantOptions) &&
      product.variantOptions.length > 0
    ) {
      const valid = product.variantOptions
        .filter((dim: any) => Array.isArray(dim.values) && dim.values.length > 0)
        .map((dim: any) => ({
          name: dim.name.trim(),
          values: Array.from(new Set(dim.values.map((val: string) => val.trim()))),
        }));
      if (valid.length > 0) return valid;
    }

    // Infer from variant discrete attributes
    const dimensionsMap: Record<string, Set<string>> = {};

    const addValue = (dimName: string, val?: string) => {
      if (!val || !val.trim()) return;
      if (!dimensionsMap[dimName]) dimensionsMap[dimName] = new Set();
      dimensionsMap[dimName].add(val.trim());
    };

    variants.forEach((v) => {
      addValue("Color", v.color);
      addValue("Size", v.size);
      addValue("Length", v.length);
      addValue("Sleeve", v.sleeve);
      addValue("Fit", v.fit);

      if (v.options && typeof v.options === "object") {
        Object.entries(v.options).forEach(([k, val]) => {
          if (typeof val === "string") {
            const formattedKey =
              k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
            addValue(formattedKey, val);
          }
        });
      }
    });

    const inferredDimensions: Dimension[] = Object.entries(dimensionsMap).map(
      ([name, set]) => ({
        name,
        values: Array.from(set),
      })
    );

    // If discrete properties gave at least one dimension
    if (inferredDimensions.length > 0) {
      return inferredDimensions;
    }

    // Fallback: If variants only have unique labels (e.g. "Green", "Size 12", "L / Gold")
    if (variants.length > 1) {
      const distinctLabels = Array.from(
        new Set(variants.map((v) => v.label.trim()).filter(Boolean))
      );
      if (distinctLabels.length > 1) {
        return [{ name: "Option", values: distinctLabels }];
      }
    }

    return [];
  }, [product, variants]);

  /* ──────────────────────────────────────────────────────────────────
   * 2. Initial Selected State Setup
   * ────────────────────────────────────────────────────────────────── */
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      if (variants.length > 0) {
        // Prefer first in-stock variant
        const firstInStock =
          variants.find((v) => getVariantStock(v) > 0) || variants[0];

        optionDimensions.forEach((dim) => {
          const dimKey = dim.name.toLowerCase();
          const val =
            (firstInStock as any)[dimKey] ||
            firstInStock.options?.[dim.name] ||
            firstInStock.options?.[dimKey] ||
            "";

          if (val && dim.values.some((dv) => dv.toLowerCase() === val.toLowerCase())) {
            initial[dim.name] = val;
          } else if (dim.values.length > 0) {
            initial[dim.name] = dim.values[0];
          }
        });

        // Fallback for single "Option" dimension
        if (
          optionDimensions.length === 1 &&
          optionDimensions[0].name === "Option"
        ) {
          initial["Option"] = firstInStock.label || optionDimensions[0].values[0];
        }
      }
      return initial;
    }
  );

  /* ──────────────────────────────────────────────────────────────────
   * 3. Robust Variant Matcher
   * ────────────────────────────────────────────────────────────────── */
  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    if (optionDimensions.length === 0) return variants[0];

    // Check exact match
    const exact = variants.find((v) => {
      return optionDimensions.every((dim) => {
        const expected = (selectedOptions[dim.name] || "").toLowerCase().trim();
        if (!expected) return true;

        if (dim.name === "Option") {
          return v.label.toLowerCase().trim() === expected;
        }

        const dimKey = dim.name.toLowerCase();
        const propVal = String((v as any)[dimKey] || "").toLowerCase().trim();
        const mapVal = String(
          v.options?.[dim.name] || v.options?.[dimKey] || ""
        )
          .toLowerCase()
          .trim();

        if (propVal === expected || mapVal === expected) return true;

        // Check if label contains value as a token
        if (v.label) {
          const tokens = v.label
            .toLowerCase()
            .split(/[\/,\-\|]/)
            .map((t) => t.trim());
          if (tokens.includes(expected)) return true;
        }

        return false;
      });
    });

    if (exact) return exact;

    // Fallback: match highest score
    let best = variants[0];
    let maxScore = -1;

    variants.forEach((v) => {
      let score = 0;
      optionDimensions.forEach((dim) => {
        const expected = (selectedOptions[dim.name] || "").toLowerCase().trim();
        if (!expected) return;

        const dimKey = dim.name.toLowerCase();
        const propVal = String((v as any)[dimKey] || "").toLowerCase().trim();
        const mapVal = String(
          v.options?.[dim.name] || v.options?.[dimKey] || ""
        )
          .toLowerCase()
          .trim();

        if (
          propVal === expected ||
          mapVal === expected ||
          (v.label && v.label.toLowerCase().includes(expected))
        ) {
          score++;
        }
      });
      if (score > maxScore) {
        maxScore = score;
        best = v;
      }
    });

    return best;
  }, [variants, optionDimensions, selectedOptions]);

  const selectedStock = getVariantStock(selectedVariant);
  const isOutOfStock = selectedStock <= 0;
  const currentPrice = selectedVariant?.price || product.basePrice || 0;

  /* ──────────────────────────────────────────────────────────────────
   * 4. Dimension Value Availability Inspector
   * ────────────────────────────────────────────────────────────────── */
  const checkValueStatus = (dimName: string, value: string) => {
    // 1. Check if combination with currently selected other dimensions exists & has stock
    const testOptions = { ...selectedOptions, [dimName]: value };

    const matching = variants.find((v) => {
      return optionDimensions.every((d) => {
        const expected = (testOptions[d.name] || "").toLowerCase().trim();
        if (!expected) return true;

        if (d.name === "Option") {
          return v.label.toLowerCase().trim() === expected;
        }

        const key = d.name.toLowerCase();
        const propVal = String((v as any)[key] || "").toLowerCase().trim();
        const mapVal = String(
          v.options?.[d.name] || v.options?.[key] || ""
        )
          .toLowerCase()
          .trim();

        if (propVal === expected || mapVal === expected) return true;
        if (v.label && v.label.toLowerCase().split(/[\/,\-\|]/).map((t) => t.trim()).includes(expected)) {
          return true;
        }
        return false;
      });
    });

    if (matching) {
      const stock = getVariantStock(matching);
      return {
        existsInCurrentCombo: true,
        inStock: stock > 0,
        stock,
        variantId: matching._id,
      };
    }

    // 2. Check if this value exists in ANY variant
    const existsAnywhere = variants.some((v) => {
      if (dimName === "Option") {
        return v.label.toLowerCase().trim() === value.toLowerCase().trim();
      }
      const key = dimName.toLowerCase();
      const propVal = String((v as any)[key] || "").toLowerCase().trim();
      const mapVal = String(
        v.options?.[dimName] || v.options?.[key] || ""
      )
        .toLowerCase()
        .trim();
      return (
        propVal === value.toLowerCase().trim() ||
        mapVal === value.toLowerCase().trim() ||
        (v.label && v.label.toLowerCase().split(/[\/,\-\|]/).map((t) => t.trim()).includes(value.toLowerCase().trim()))
      );
    });

    return {
      existsInCurrentCombo: false,
      inStock: false,
      stock: 0,
      variantId: null,
      existsAnywhere,
    };
  };

  const handleSelectDimension = (dimName: string, value: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [dimName]: value };

      // If this combination doesn't exist, auto-align other dimensions to the best variant
      const exact = variants.find((v) => {
        return optionDimensions.every((d) => {
          const expected = (next[d.name] || "").toLowerCase().trim();
          if (!expected) return true;
          if (d.name === "Option") return v.label.toLowerCase().trim() === expected;
          const key = d.name.toLowerCase();
          const propVal = String((v as any)[key] || "").toLowerCase().trim();
          const mapVal = String(
            v.options?.[d.name] || v.options?.[key] || ""
          ).toLowerCase().trim();
          return propVal === expected || mapVal === expected;
        });
      });

      if (!exact) {
        // Find first variant that has this value and sync
        const alternative = variants.find((v) => {
          if (dimName === "Option") return v.label.toLowerCase().trim() === value.toLowerCase().trim();
          const key = dimName.toLowerCase();
          const propVal = String((v as any)[key] || "").toLowerCase().trim();
          const mapVal = String(
            v.options?.[dimName] || v.options?.[key] || ""
          ).toLowerCase().trim();
          return propVal === value.toLowerCase().trim() || mapVal === value.toLowerCase().trim();
        });

        if (alternative) {
          optionDimensions.forEach((d) => {
            if (d.name !== dimName) {
              const k = d.name.toLowerCase();
              const newVal =
                (alternative as any)[k] ||
                alternative.options?.[d.name] ||
                alternative.options?.[k] ||
                "";
              if (newVal) next[d.name] = newVal;
            }
          });
        }
      }

      return next;
    });
  };

  /* ──────────────────────────────────────────────────────────────────
   * 5. Quantity & Cart State
   * ────────────────────────────────────────────────────────────────── */
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useVendorCart(handle);

  const handleIncrement = () => {
    if (quantity < selectedStock) {
      setQuantity((q) => q + 1);
    } else {
      toast.error(`Only ${selectedStock} pieces available in this option.`);
    }
  };

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    if (isOutOfStock) {
      toast.error("This variant is currently out of stock.");
      return;
    }

    if (quantity > selectedStock) {
      toast.error(`Only ${selectedStock} pieces available.`);
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
      quantity > 1 ? `Added ${quantity} items to your bag!` : "Added to your shopping bag!"
    );
  };

  /* ──────────────────────────────────────────────────────────────────
   * 6. Gallery & Media State
   * ────────────────────────────────────────────────────────────────── */
  const images = useMemo(() => {
    return Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : [];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    setActiveImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (images.length <= 1) return;
    setActiveImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  // Keyboard navigation for image lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  /* ──────────────────────────────────────────────────────────────────
   * 7. Accordion Disclosure States
   * ────────────────────────────────────────────────────────────────── */
  const [openAccordion, setOpenAccordion] = useState<string>("details");

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => (prev === section ? "" : section));
  };

  /* ──────────────────────────────────────────────────────────────────
   * 8. WhatsApp Inquiry Deeplink
   * ────────────────────────────────────────────────────────────────── */
  const whatsappInquiryUrl = useMemo(() => {
    if (!whatsappPhone) return "";
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const variantDesc = selectedVariant?.label ? ` (Option: ${selectedVariant.label})` : "";
    const message = `Hello ${businessName}! I'm looking at "${product.name}"${variantDesc} priced at ${formatCurrency(currentPrice)} on your Vendra storefront.\n\nLink: ${pageUrl}\n\nPlease confirm availability and dispatch timeline.`;
    return buildWhatsAppLink(whatsappPhone, message);
  }, [whatsappPhone, businessName, product.name, selectedVariant, currentPrice]);

  /* ──────────────────────────────────────────────────────────────────
   * 9. Sticky Mobile Purchase Bar Observer
   * ────────────────────────────────────────────────────────────────── */
  const ctaButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ctaButtonRef.current) {
      observer.observe(ctaButtonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out ${product.name} on ${businessName}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-12">
      {/* ── Breadcrumb Navigation ──────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-stone-500">
        <ol className="flex items-center flex-wrap gap-2">
          <li>
            <Link
              href={`/store/${handle}`}
              className="hover:text-stone-900 transition-colors"
            >
              {businessName}
            </Link>
          </li>
          <li>/</li>
          {product.category && (
            <>
              <li>
                <Link
                  href={`/store/${handle}/products?category=${encodeURIComponent(
                    product.category
                  )}`}
                  className="hover:text-stone-900 transition-colors capitalize"
                >
                  {product.category}
                </Link>
              </li>
              <li>/</li>
            </>
          )}
          <li className="text-stone-900 font-semibold truncate max-w-[240px] sm:max-w-md">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ── Main Two-Column Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
        {/* ── LEFT COLUMN: Editorial Image Gallery (3:4 Fashion Portrait) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative group overflow-hidden rounded-3xl bg-stone-100 border border-stone-200/80 shadow-xs aspect-[3/4] sm:aspect-[4/5] flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex]?.url}
                alt={product.name}
                className="w-full h-full object-cover object-center cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="text-center p-8 space-y-2 text-stone-400">
                <ShoppingBag size={40} className="mx-auto stroke-1" />
                <p className="text-xs font-medium">No imagery uploaded for this design</p>
              </div>
            )}

            {/* Quick Zoom / Lightbox Trigger */}
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-4 right-4 z-10 size-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-sm"
                aria-label="Enlarge image"
              >
                <Maximize2 size={16} />
              </button>
            )}

            {/* Image Counter Badge */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-full bg-black/50 backdrop-blur-xs text-[11px] font-semibold text-white tracking-wider">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Carousel Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Fulfillment Status Ribbon on Image */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              {product.fulfillmentType === "made_to_order" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <Sparkles size={11} className="text-amber-400" />
                  Made to Order ({product.leadTimeDays || 3-5}d)
                </span>
              ) : product.fulfillmentType === "demand" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/90 backdrop-blur-xs text-amber-100 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <Sparkles size={11} className="text-amber-300" />
                  Bespoke Couture
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-100 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to Wear
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Filmstrip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img: any, idx: number) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative size-20 sm:size-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      isActive
                        ? "ring-2 ring-offset-2 border-transparent scale-[1.02]"
                        : "border-stone-200/90 opacity-70 hover:opacity-100"
                    }`}
                    style={
                      isActive
                        ? ({
                            "--tw-ring-color": accentColor,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Product Information & Purchase Flow ───────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Info */}
          <div className="space-y-3 pb-6 border-b border-stone-200/70">
            <div className="flex items-center justify-between gap-2">
              {product.category && (
                <span
                  className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: `${accentColor}14`,
                    color: accentColor,
                  }}
                >
                  {product.category}
                </span>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Share this design"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-950 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Price & Stock Indicator */}
            <div className="flex items-baseline flex-wrap gap-3 pt-1">
              <span className="text-3xl font-serif font-bold text-gray-950">
                {formatCurrency(currentPrice)}
              </span>

              {selectedVariant && selectedVariant.price !== product.basePrice && (
                <span className="text-xs text-stone-500 line-through">
                  {formatCurrency(product.basePrice)}
                </span>
              )}

              {/* Urgency Badge */}
              {selectedStock > 0 && selectedStock <= 5 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200/80">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  Only {selectedStock} left
                </span>
              )}

              {isOutOfStock && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                  Sold Out in this selection
                </span>
              )}
            </div>

            {selectedVariant?.sku && (
              <p className="text-[11px] font-mono text-stone-400">
                SKU: {selectedVariant.sku}
              </p>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────
           * VARIANT OPTIONS SELECTOR
           * ────────────────────────────────────────────────────────── */}
          {optionDimensions.length > 0 && (
            <div className="space-y-6 pt-1">
              {optionDimensions.map((dim) => {
                const isColorDim = dim.name.toLowerCase() === "color";
                const isSizeDim = dim.name.toLowerCase() === "size";
                const currentVal = selectedOptions[dim.name] || dim.values[0];

                return (
                  <div key={dim.name} className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-stone-700">
                        {dim.name}:{" "}
                        <strong className="text-stone-950 font-bold ml-1">
                          {currentVal}
                        </strong>
                      </span>

                      {/* Sizing Chart Link for Size Dimension */}
                      {isSizeDim && (
                        <button
                          type="button"
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-950 underline underline-offset-4 transition-colors"
                        >
                          <Ruler size={13} />
                          <span>Size Guide</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {dim.values.map((val) => {
                        const isSelected =
                          (currentVal || "").toLowerCase().trim() ===
                          val.toLowerCase().trim();
                        const status = checkValueStatus(dim.name, val);

                        // If not available in current combination, show subtle visual cue
                        const isUnavailableInCombo =
                          !status.existsInCurrentCombo && status.existsAnywhere;
                        const isGloballyOutOfStock =
                          status.existsInCurrentCombo && !status.inStock;

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectDimension(dim.name, val)}
                            className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? "text-white shadow-sm ring-2 ring-offset-2 ring-stone-950"
                                : isGloballyOutOfStock
                                ? "bg-stone-100 text-stone-400 border border-stone-200 line-through opacity-60"
                                : isUnavailableInCombo
                                ? "bg-stone-50 text-stone-600 border border-dashed border-stone-300 hover:border-stone-400"
                                : "bg-white text-stone-800 border border-stone-200/90 hover:bg-stone-50 hover:border-stone-400 shadow-2xs"
                            }`}
                            style={
                              isSelected
                                ? { backgroundColor: accentColor }
                                : undefined
                            }
                            title={
                              isGloballyOutOfStock
                                ? "Sold out"
                                : isUnavailableInCombo
                                ? `Click to switch color for ${val}`
                                : val
                            }
                          >
                            <span>{val}</span>
                            {isSelected && (
                              <Check size={13} className="ml-1.5 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
           * QUANTITY SELECTOR
           * ────────────────────────────────────────────────────────── */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
              Quantity:
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="size-11 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-gray-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= selectedStock || isOutOfStock}
                  className="size-11 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              {selectedStock > 0 && (
                <span className="text-xs text-stone-500 font-medium">
                  {selectedStock} pieces in stock
                </span>
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
           * ACTIONS: ADD TO BAG & WHATSAPP CONSULTATION
           * ────────────────────────────────────────────────────────── */}
          <div className="space-y-3 pt-4">
            <button
              ref={ctaButtonRef}
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full min-h-[52px] py-4 px-6 rounded-2xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingBag size={18} />
              <span>
                {isOutOfStock
                  ? "Sold Out in this Combination"
                  : `Add to Shopping Bag • ${formatCurrency(
                      currentPrice * quantity
                    )}`}
              </span>
            </button>

            {whatsappPhone && (
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/15 text-[#128C7E] font-bold text-xs tracking-wide flex items-center justify-center gap-2 border border-[#25D366]/30 transition-colors"
              >
                <MessageCircle size={16} />
                <span>Inquire / Order Directly on WhatsApp</span>
              </a>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────
           * TRUST & CRAFTSMANSHIP GUARANTEE BADGES
           * ────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-200/80">
            <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/70 space-y-1">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <Truck size={15} className="text-amber-700" />
                <span>Express Dispatch</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Lagos delivery within 24-48 hrs; nationwide express to all 36 states.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/70 space-y-1">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <ShieldCheck size={15} className="text-emerald-700" />
                <span>Verified Atelier</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Authentic Nigerian tailoring & quality craftsmanship guaranteed.
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
           * EDITORIAL ACCORDIONS (Details, Delivery, Fabric Care)
           * ────────────────────────────────────────────────────────── */}
          <div className="border-t border-stone-200 divide-y divide-stone-200/70 pt-2 text-sm">
            {/* Description Accordion */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion("details")}
                className="w-full flex items-center justify-between text-left font-bold text-stone-900"
              >
                <span>Garment Description & Fit</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    openAccordion === "details" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordion === "details" && (
                <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed space-y-3">
                  <p className="whitespace-pre-line">
                    {product.description ||
                      "Elevated Nigerian silhouette crafted with attention to structure, drape, and movement. Suitable for formal events, celebrations, and luxury casual wear."}
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Rates Accordion */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion("delivery")}
                className="w-full flex items-center justify-between text-left font-bold text-stone-900"
              >
                <span>Delivery Rates & Timeline</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    openAccordion === "delivery" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordion === "delivery" && (
                <div className="mt-3 text-xs text-stone-600 leading-relaxed space-y-2.5">
                  {deliveryRates.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="font-semibold text-stone-900 mb-2">
                        Configured Dispatch Rates:
                      </p>
                      {deliveryRates.map((rate: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 border-b border-stone-100 last:border-0"
                        >
                          <span className="font-medium text-stone-700">
                            {rate.state || rate.region}
                          </span>
                          <span className="font-bold text-stone-900">
                            {formatCurrency(rate.amount || rate.fee || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>
                      Standard dispatch timeline: orders processed within 24 hours.
                      Delivery fee calculated at checkout based on delivery address.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Fabric & Care Accordion */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion("care")}
                className="w-full flex items-center justify-between text-left font-bold text-stone-900"
              >
                <span>Fabric & Garment Care</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    openAccordion === "care" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openAccordion === "care" && (
                <div className="mt-3 text-xs text-stone-600 leading-relaxed space-y-1.5">
                  <p>• Hand wash in cool water or dry clean recommended for preserved color vitality.</p>
                  <p>• Do not tumble dry. Line dry in shade.</p>
                  <p>• Warm iron on reverse side to protect fabric luster and intricate embroidery.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
       * 10. STICKY MOBILE ADD-TO-BAG BAR
       * ────────────────────────────────────────────────────────────── */}
      {showStickyBar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 sm:p-4 shadow-xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {images.length > 0 && (
                <img
                  src={images[0].url}
                  alt=""
                  className="size-11 rounded-lg object-cover shrink-0 border border-stone-200"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-950 truncate">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-stone-700">
                  {formatCurrency(currentPrice)}
                  {selectedVariant?.label && (
                    <span className="text-[11px] font-normal text-stone-500 ml-1.5 truncate">
                      • {selectedVariant.label}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shrink-0 shadow-sm active:scale-98 transition-all disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {isOutOfStock ? "Sold Out" : "Add to Bag"}
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
       * 11. SIZE GUIDE & MEASUREMENTS MODAL
       * ────────────────────────────────────────────────────────────── */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-stone-800" />
                <h3 className="font-serif font-bold text-lg text-stone-950">
                  Garment Sizing & Measurements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              All measurements are in inches. For bespoke orders or custom alterations,
              measure snugly around the fullest point of bust and hips.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust (in)</th>
                    <th className="py-2.5 px-3">Waist (in)</th>
                    <th className="py-2.5 px-3">Hips (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {SIZE_GUIDE_CHART.map((row) => (
                    <tr key={row.size} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-3 font-semibold">{row.size}</td>
                      <td className="py-2.5 px-3">{row.bust}</td>
                      <td className="py-2.5 px-3">{row.waist}</td>
                      <td className="py-2.5 px-3">{row.hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Need a Custom Silhouette?</p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                You can select your closest size now and message the tailor on WhatsApp with your exact shoulder, bust, waist, and gown length measurements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full py-3 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
       * 12. HIGH-RESOLUTION IMAGE LIGHTBOX MODAL
       * ────────────────────────────────────────────────────────────── */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close full view"
          >
            <X size={22} />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeImageIndex]?.url}
              alt={product.name}
              className="max-h-[85vh] max-w-full object-contain rounded-xl select-none"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
