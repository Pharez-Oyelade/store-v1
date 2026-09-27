"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  WifiOff,
  Package,
  Layers2,
} from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  FieldLabel,
  NativeSelect,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import {
  useProductOptions,
  CATEGORY_OPTION_PRESETS,
} from "@/hooks/useProductOptions";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { generateLocalId } from "@/lib/offline/outbox";
import CreatableCombobox from "@/components/ui/CreatableCombobox";
import CreatableTagInput from "@/components/ui/CreatableTagInput";
import {
  ProductStatus,
  type Product,
  type ProductVariant,
  type VariantOptionDimension,
} from "@/types";
import VariantOptionsInline from "@/components/dashboard/variants/VariantOptionsInline";
import VariantMatrixTable, {
  type VariantDraft,
} from "@/components/dashboard/variants/VariantMatrixTable";
import toast from "react-hot-toast";

const blankVariant: VariantDraft = {
  label: "",
  size: "",
  color: "",
  length: "",
  fit: "",
  sleeve: "",
  custom: "",
  sku: "",
  price: "",
  quantity: "",
};

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?._id ?? "");
  const {
    categories,
    tags: suggestedTags,
    sizes,
    colors,
    lengths,
    fits,
    sleeves,
    addCategory,
    addTag,
    addSize,
    addColor,
    addLength,
    addFit,
    addSleeve,
  } = useProductOptions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.Draft);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    5,
  );
  const [files, setFiles] = useState<FileList | null>(null);

  // Variant mode: Simple (single price & stock) vs Variable (multiple options)
  const [hasVariants, setHasVariants] = useState(false);
  const [simplePrice, setSimplePrice] = useState<number | string>("");
  const [simpleStock, setSimpleStock] = useState<number | string>("");
  const [simpleSku, setSimpleSku] = useState("");

  // Variable product options & matrix state
  const [variantOptions, setVariantOptions] = useState<
    VariantOptionDimension[]
  >([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [selectedVariantIndices, setSelectedVariantIndices] = useState<
    number[]
  >([]);
  const [dismissedCategoryPreset, setDismissedCategoryPreset] = useState<
    string | null
  >(null);
  const [highlightInvalidPrices, setHighlightInvalidPrices] = useState(false);

  // Re-hydrate on product prop change
  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setCategory(product.category ?? "");
    setTags(Array.isArray(product.tags) ? product.tags : []);
    setStatus(product.status);
    setLowStockThreshold(product.lowStockThreshold);

    const isMultiple = Boolean(
      product.hasVariants ||
      (product.variants && product.variants.length > 1) ||
      product.variants?.[0]?.size ||
      product.variants?.[0]?.color ||
      product.variants?.[0]?.length ||
      product.variants?.[0]?.sleeve ||
      product.variants?.[0]?.fit,
    );
    setHasVariants(isMultiple);

    if (product.variantOptions && product.variantOptions.length > 0) {
      setVariantOptions(product.variantOptions);
    } else if (isMultiple && product.variants) {
      // Infer dimensions from variants
      const inferred: VariantOptionDimension[] = [];
      const s = Array.from(
        new Set(product.variants.map((v) => v.size).filter(Boolean)),
      ) as string[];
      const l = Array.from(
        new Set(product.variants.map((v) => v.length).filter(Boolean)),
      ) as string[];
      const c = Array.from(
        new Set(product.variants.map((v) => v.color).filter(Boolean)),
      ) as string[];
      const sl = Array.from(
        new Set(product.variants.map((v) => v.sleeve).filter(Boolean)),
      ) as string[];
      const f = Array.from(
        new Set(product.variants.map((v) => v.fit).filter(Boolean)),
      ) as string[];

      if (s.length > 0) inferred.push({ name: "Size", values: s });
      if (l.length > 0) inferred.push({ name: "Length", values: l });
      if (c.length > 0) inferred.push({ name: "Color", values: c });
      if (sl.length > 0) inferred.push({ name: "Sleeve", values: sl });
      if (f.length > 0) inferred.push({ name: "Fit", values: f });

      setVariantOptions(inferred);
    }

    if (!isMultiple && product.variants?.[0]) {
      setSimplePrice(product.variants[0].price);
      setSimpleStock(product.variants[0].quantity);
      setSimpleSku(product.variants[0].sku || "");
    }

    setVariants(product.variants.map((variant) => ({ ...variant })));
  }, [product]);

  // Contextual category recommendation check
  const activeCategoryPreset = useMemo(() => {
    if (!category.trim()) return null;
    const matchKey = Object.keys(CATEGORY_OPTION_PRESETS).find(
      (k) => k.toLowerCase() === category.trim().toLowerCase(),
    );
    if (!matchKey) return null;
    if (dismissedCategoryPreset === matchKey) return null;

    const preset = CATEGORY_OPTION_PRESETS[matchKey];
    // Only recommend if some preset dimensions are not yet added
    const missingDims = preset.dimensions.filter(
      (dim) =>
        !variantOptions.some((d) => d.name.toLowerCase() === dim.toLowerCase()),
    );
    if (missingDims.length === 0) return null;

    return { categoryKey: matchKey, ...preset, missingDims };
  }, [category, variantOptions, dismissedCategoryPreset]);

  // Cartesian combination generator (pure helper)
  const computeCombinations = useCallback(
    (
      dims: VariantOptionDimension[],
      currentVariants: VariantDraft[],
      defaultPrice: number | string,
      defaultStock: number | string,
    ): VariantDraft[] => {
      const activeDims = dims.filter((d) => d.values && d.values.length > 0);
      if (activeDims.length === 0) {
        return [];
      }

      const cartesian = (arrays: string[][]): string[][] =>
        arrays.reduce(
          (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
          [[]] as string[][],
        );

      const combinations = cartesian(activeDims.map((d) => d.values));

      return combinations.map((combo) => {
        const attributes: Record<string, string> = {};
        activeDims.forEach((dim, idx) => {
          attributes[dim.name.toLowerCase()] = combo[idx];
        });

        const size = attributes["size"] || "";
        const color = attributes["color"] || "";
        const length = attributes["length"] || "";
        const fit = attributes["fit"] || "";
        const sleeve = attributes["sleeve"] || "";

        // Match existing variant to keep price, stock, and SKU
        const existing = currentVariants.find(
          (v) =>
            (v.size || "") === size &&
            (v.color || "") === color &&
            (v.length || "") === length &&
            (v.fit || "") === fit &&
            (v.sleeve || "") === sleeve,
        );

        const labelParts = [size, color, length, fit, sleeve].filter(Boolean);
        Object.keys(attributes).forEach((k) => {
          if (
            !["size", "color", "length", "fit", "sleeve"].includes(k) &&
            attributes[k]
          ) {
            labelParts.push(attributes[k]);
          }
        });
        const canonicalLabel = labelParts.join(" / ") || "Standard";

        return {
          label: existing?.label || canonicalLabel,
          size,
          color,
          length,
          fit,
          sleeve,
          sku: existing?.sku || "",
          custom: existing?.custom || "",
          price:
            existing && existing.price !== ""
              ? existing.price
              : defaultPrice !== ""
                ? defaultPrice
                : "",
          quantity:
            existing && existing.quantity !== ""
              ? existing.quantity
              : defaultStock !== ""
                ? defaultStock
                : "",
          sold: existing?.sold ?? 0,
        };
      });
    },
    [],
  );

  // Auto-generate variants whenever dimensions change
  function handleDimensionsChange(nextDims: VariantOptionDimension[]) {
    setVariantOptions(nextDims);
    setVariants((current) =>
      computeCombinations(nextDims, current, simplePrice, simpleStock),
    );
    setSelectedVariantIndices([]);
    setHighlightInvalidPrices(false);
  }

  function handleApplyCategoryPreset() {
    if (!activeCategoryPreset) return;
    setHasVariants(true);

    const updatedDims = [...variantOptions];
    activeCategoryPreset.dimensions.forEach((dimName) => {
      const existing = updatedDims.find(
        (d) => d.name.toLowerCase() === dimName.toLowerCase(),
      );
      // Give standard recommended values if available
      let recommendedVals =
        activeCategoryPreset.recommendedValues?.[dimName] || [];

      // If no preset values specified, provide standard sensible defaults
      if (recommendedVals.length === 0) {
        const lower = dimName.toLowerCase();
        if (lower === "size") recommendedVals = ["S", "M", "L", "XL"];
        else if (lower === "color") recommendedVals = ["Black", "White"];
      }

      if (!existing) {
        updatedDims.push({
          name: dimName,
          values: recommendedVals,
        });
      } else if (recommendedVals.length > 0) {
        existing.values = Array.from(
          new Set([...existing.values, ...recommendedVals]),
        );
      }
    });

    handleDimensionsChange(updatedDims);
    toast.success(
      `Applied ${activeCategoryPreset.categoryKey} presets!`,
    );
  }

  // Bulk actions handlers for VariantMatrixTable
  function handleApplyPriceAndStockToAll(bulkPrice: string, bulkStock: string) {
    setVariants((current) =>
      current.map((v) => ({
        ...v,
        price: bulkPrice !== "" ? bulkPrice : v.price,
        quantity: bulkStock !== "" ? bulkStock : v.quantity,
      })),
    );
    setHighlightInvalidPrices(false);
    toast.success("Applied to all variants");
  }

  function handleApplyPriceAndStockToSelected(
    bulkPrice: string,
    bulkStock: string,
  ) {
    setVariants((current) =>
      current.map((v, i) => {
        if (!selectedVariantIndices.includes(i)) return v;
        return {
          ...v,
          price: bulkPrice !== "" ? bulkPrice : v.price,
          quantity: bulkStock !== "" ? bulkStock : v.quantity,
        };
      }),
    );
    setHighlightInvalidPrices(false);
    toast.success(
      `Applied to ${selectedVariantIndices.length} selected variants`,
    );
  }

  function handleDeleteSelected() {
    if (selectedVariantIndices.length === 0) return;
    setVariants((current) =>
      current.filter((_, i) => !selectedVariantIndices.includes(i)),
    );
    setSelectedVariantIndices([]);
    toast.success("Deleted selected variants");
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedVariantIndices(variants.map((_, i) => i));
    } else {
      setSelectedVariantIndices([]);
    }
  }

  function handleToggleSelect(index: number) {
    setSelectedVariantIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  function handleUpdateVariant(
    index: number,
    field: keyof VariantDraft,
    value: any,
  ) {
    setVariants((current) =>
      current.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
    if (field === "price" && value !== "" && Number(value) >= 0) {
      // Clear highlight error if all variants become priced
      setHighlightInvalidPrices(false);
    }
  }

  function handleDeleteSingleVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
    setSelectedVariantIndices((prev) => prev.filter((i) => i !== index));
  }

  function handleDuplicateVariant(index: number) {
    const target = variants[index];
    if (!target) return;
    const clone: VariantDraft = {
      ...target,
      label: `${target.label || "Variant"} (Copy)`,
    };
    setVariants((current) => [...current, clone]);
    toast.success("Variant duplicated");
  }

  function handleAddBlankVariant() {
    setVariants((current) => [
      ...current,
      {
        ...blankVariant,
        price: simplePrice || "",
        quantity: simpleStock || "",
        label: `Custom Variant ${current.length + 1}`,
      },
    ]);
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  const { handleOfflineSave, isOnline } = useOfflineMutation({
    entityType: "product",
    endpoint: product ? `/products/${product._id}` : "/products",
    method: product ? "PUT" : "POST",
    description: `${product ? "Update" : "Create"} Product: ${name || "New Product"}`,
    queryKeyToUpdate: ["products"],
    getOptimisticRecord: (tempId, payload) => {
      const parsedVariants =
        typeof payload.variants === "string"
          ? JSON.parse(payload.variants)
          : payload.variants;
      return {
        _id: product?._id || tempId,
        id: product?._id || tempId,
        name,
        description,
        category,
        tags,
        status: status || "active",
        hasVariants,
        variantOptions,
        variants: parsedVariants,
        images: product?.images || [],
        basePrice: Number(parsedVariants[0]?.price) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  });

  function getFinalVariantsPayload() {
    if (!hasVariants) {
      return [
        {
          label: "Standard",
          size: "",
          color: "",
          length: "",
          fit: "",
          sleeve: "",
          custom: "",
          sku: simpleSku || "",
          price: Number(simplePrice) || 0,
          quantity: Number(simpleStock) || 0,
          sold: 0,
        },
      ];
    }

    return variants.map((v) => ({
      label:
        v.label ||
        [v.size, v.color, v.length, v.fit, v.sleeve]
          .filter(Boolean)
          .join(" / ") ||
        "Standard",
      size: v.size || "",
      color: v.color || "",
      length: v.length || "",
      fit: v.fit || "",
      sleeve: v.sleeve || "",
      custom: v.custom || "",
      sku: v.sku || "",
      price: Number(v.price) || 0,
      quantity: Number(v.quantity) || 0,
      sold: v.sold ?? 0,
    }));
  }

  function buildFormData() {
    // Persist category, tags, and option attributes
    if (category.trim()) addCategory(category.trim());
    tags.forEach((t) => addTag(t));
    if (hasVariants) {
      variants.forEach((v) => {
        if (v.size?.trim()) addSize(v.size.trim());
        if (v.color?.trim()) addColor(v.color.trim());
        if (v.length?.trim()) addLength(v.length.trim());
        if (v.fit?.trim()) addFit(v.fit.trim());
        if (v.sleeve?.trim()) addSleeve(v.sleeve.trim());
      });
    }

    const finalVariants = getFinalVariantsPayload();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags.join(", "));
    formData.append("status", status);
    formData.append(
      "lowStockThreshold",
      String(Number(lowStockThreshold) || 0),
    );
    formData.append("hasVariants", String(hasVariants));
    formData.append(
      "variantOptions",
      JSON.stringify(hasVariants ? variantOptions : []),
    );
    formData.append("variants", JSON.stringify(finalVariants));

    Array.from(files ?? []).forEach((file) => formData.append("images", file));
    return formData;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validation: if simple product, require price
    if (!hasVariants && (simplePrice === "" || Number(simplePrice) < 0)) {
      toast.error("Please enter a valid price for the product.");
      return;
    }

    // Validation: if hasVariants, ensure at least one variant exists and all have valid prices
    if (hasVariants) {
      if (variants.length === 0) {
        toast.error("Please add at least one option and value for your variants.");
        return;
      }

      const unpriced = variants.some(
        (v) => v.price === "" || Number(v.price) < 0,
      );
      if (unpriced) {
        setHighlightInvalidPrices(true);
        toast.error("Please ensure all variants have a valid price (≥ 0).");
        return;
      }
    }

    const formData = buildFormData();
    const finalVariants = getFinalVariantsPayload();

    const fileList = Array.from(files ?? []).map((file) => ({
      file,
      name: file.name,
    }));

    const productPayload = {
      name,
      description,
      category,
      tags: tags.join(", "),
      status,
      lowStockThreshold: Number(lowStockThreshold) || 0,
      hasVariants,
      variantOptions: JSON.stringify(hasVariants ? variantOptions : []),
      variants: JSON.stringify(finalVariants),
    };

    if (!navigator.onLine || !isOnline) {
      await handleOfflineSave(
        product?._id || generateLocalId("temp_product"),
        productPayload,
        fileList.length > 0 ? fileList : undefined,
      );
      router.push("/dashboard/products");
      return;
    }

    try {
      if (product) {
        await updateProduct.mutateAsync(formData);
        toast.success("Product updated successfully!");
      } else {
        await createProduct.mutateAsync(formData);
        toast.success("Product created successfully!");
      }
      router.push("/dashboard/products");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred.";
      toast.error(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-2 max-w-6xl mx-auto"
    >
      {/* Left Column: Core Identity & Media */}
      <section className="space-y-4 sm:space-y-5 rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-card">
        <div>
          <h2 className="text-base font-semibold text-gray-950">
            Product Details
          </h2>
          <p className="text-xs text-gray-500">
            Basic information about your product.
          </p>
        </div>

        <Input
          label="Product name"
          placeholder="e.g. Adire Silk Wrap Dress"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CreatableCombobox
            label="Category"
            value={category}
            onChange={(val) => setCategory(val)}
            onAddOption={addCategory}
            options={categories}
            placeholder="Select or type category..."
            helper="e.g. Dresses, Kaftan, Gowns"
          />

          <CreatableTagInput
            label="Tags"
            value={tags}
            onChange={(val) => setTags(val)}
            onAddOption={addTag}
            options={suggestedTags}
            placeholder="Select or type tags..."
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Description</FieldLabel>
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the silhouette, fabric texture, styling occasions, and fit..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <NativeSelect
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ProductStatus)
              }
            >
              {Object.values(ProductStatus).map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Input
            label="Low stock threshold"
            type="number"
            min={0}
            placeholder="5"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(event.target.value)}
            helper="Triggers alert when any variant hits this qty"
          />
        </div>

        <Input
          label={product ? "Add more images" : "Product images"}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            const oversized = selected.filter((f) => f.size > 15 * 1024 * 1024);
            if (oversized.length > 0) {
              toast.error("One or more images exceed the 15MB limit.");
              event.target.value = "";
              return;
            }
            setFiles(event.target.files);
          }}
          helper={
            product
              ? "Existing images stay attached. New uploads are appended."
              : "Upload up to 5 images (max 15MB each)."
          }
        />
      </section>

      {/* Right Column: Pricing & Simplified Fashion Variants */}
      <section className="space-y-4 sm:space-y-5 rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-950 flex items-center gap-1.5">
              <Layers2 className="size-4 text-brand-600" />
              Pricing & Variants
            </h2>
            <p className="text-xs text-gray-500">
              Manage single pricing or configure options (Size, Color, Length).
            </p>
          </div>

          {/* Toggle between Simple and Variable */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 p-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setHasVariants(false);
                setHighlightInvalidPrices(false);
              }}
              className={`flex-1 sm:flex-initial rounded-md px-3 py-1.5 sm:py-1 text-xs font-semibold text-center transition-all ${
                !hasVariants
                  ? "bg-white text-gray-950 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Single Price
            </button>
            <button
              type="button"
              onClick={() => {
                setHasVariants(true);
                // Initialize default option if none yet
                if (variantOptions.length === 0) {
                  const initialDims: VariantOptionDimension[] = [
                    { name: "Size", values: [] },
                  ];
                  handleDimensionsChange(initialDims);
                } else if (variants.length > 0 && simplePrice) {
                  // Pre-fill prices with simplePrice if blank
                  setVariants((cur) =>
                    cur.map((v) => ({
                      ...v,
                      price: v.price === "" ? simplePrice : v.price,
                      quantity: v.quantity === "" ? simpleStock : v.quantity,
                    })),
                  );
                }
              }}
              className={`flex-1 sm:flex-initial rounded-md px-3 py-1.5 sm:py-1 text-xs font-semibold text-center transition-all ${
                hasVariants
                  ? "bg-brand-600 text-white shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Multiple Variants
            </button>
          </div>
        </div>

        {/* 1. SIMPLE PRODUCT VIEW */}
        {!hasVariants ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Package className="size-4 text-gray-400" />
              <span>
                This product has a single price and inventory level without options.
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Price (₦)"
                type="number"
                min={0}
                placeholder="25,000"
                value={simplePrice}
                onChange={(e) => setSimplePrice(e.target.value)}
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                min={0}
                placeholder="10"
                value={simpleStock}
                onChange={(e) => setSimpleStock(e.target.value)}
                required
              />
            </div>
            <Input
              label="SKU / Barcode"
              placeholder="e.g. DR-001"
              value={simpleSku}
              onChange={(e) => setSimpleSku(e.target.value)}
            />
          </div>
        ) : (
          /* 2. VARIABLE PRODUCT VIEW (Shopify/Etsy-style streamlined flow) */
          <div className="space-y-4">
            {/* Base Price & Stock fallback inputs (convenient quick reference) */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">Base Price & Stock:</span>
                <span className="text-[11px] text-gray-400 block sm:inline sm:ml-1.5">
                  Applied to newly added variant options automatically
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Base Price"
                    value={simplePrice}
                    onChange={(e) => setSimplePrice(e.target.value)}
                    className="h-7 w-full rounded border border-gray-200 bg-white pl-6 pr-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="relative w-20">
                  <input
                    type="number"
                    min={0}
                    placeholder="Stock"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    className="h-7 w-full rounded border border-gray-200 bg-white px-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Streamlined Options Builder */}
            <VariantOptionsInline
              dimensions={variantOptions}
              onChange={handleDimensionsChange}
              availableSizes={sizes}
              availableColors={colors}
              availableLengths={lengths}
              availableFits={fits}
              availableSleeves={sleeves}
              onAddCustomSize={addSize}
              onAddCustomColor={addColor}
              onAddCustomLength={addLength}
              onAddCustomFit={addFit}
              onAddCustomSleeve={addSleeve}
              activeCategoryPreset={activeCategoryPreset}
              onApplyCategoryPreset={handleApplyCategoryPreset}
            />

            {/* Streamlined Matrix Table with integrated quick fill */}
            <VariantMatrixTable
              variants={variants}
              selectedIndices={selectedVariantIndices}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onUpdateVariant={handleUpdateVariant}
              onDeleteVariant={handleDeleteSingleVariant}
              onDuplicateVariant={handleDuplicateVariant}
              onAddBlankVariant={handleAddBlankVariant}
              onApplyPriceAndStockToAll={handleApplyPriceAndStockToAll}
              onApplyPriceAndStockToSelected={handleApplyPriceAndStockToSelected}
              onDeleteSelected={handleDeleteSelected}
              highlightInvalidPrices={highlightInvalidPrices}
            />
          </div>
        )}

        {/* Form Submission Action */}
        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isPending}
            leftIcon={
              !isOnline ? (
                <WifiOff className="size-4" />
              ) : (
                <Save className="size-4" />
              )
            }
            className="w-full"
          >
            {!isOnline
              ? "Save Offline (Syncs Later)"
              : product
                ? "Save product changes"
                : "Create product"}
          </Button>
        </div>
      </section>
    </form>
  );
}
