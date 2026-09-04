"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  FieldLabel,
  NativeSelect,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useProductOptions } from "@/hooks/useProductOptions";
import CreatableCombobox from "@/components/ui/CreatableCombobox";
import CreatableTagInput from "@/components/ui/CreatableTagInput";
import { ProductStatus, type Product, type ProductVariant } from "@/types";
import toast from "react-hot-toast";

type VariantDraft = Omit<ProductVariant, "sold" | "price" | "quantity"> & {
  price: number | string;
  quantity: number | string;
  sold?: number;
};

const blankVariant: VariantDraft = {
  label: "",
  size: "",
  color: "",
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
    addCategory,
    addTag,
    addSize,
    addColor,
  } = useProductOptions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.Draft);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(5);
  const [variants, setVariants] = useState<VariantDraft[]>([blankVariant]);
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setCategory(product.category ?? "");
    setTags(Array.isArray(product.tags) ? product.tags : []);
    setStatus(product.status);
    setLowStockThreshold(product.lowStockThreshold);
    setVariants(product.variants.map((variant) => ({ ...variant })));
  }, [product]);

  const isPending = createProduct.isPending || updateProduct.isPending;

  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((current) =>
      current.map((variant, i) => {
        if (i !== index) return variant;

        const updated = {
          ...variant,
          [field]: value,
        };

        // Smart auto-label: If user edits size or color and label is empty or matches previous auto-pattern
        const isAutoLabel =
          !variant.label ||
          variant.label === `${variant.size} / ${variant.color}` ||
          variant.label === variant.size ||
          variant.label === variant.color;

        if ((field === "size" || field === "color") && isAutoLabel) {
          const nextSize = field === "size" ? value : variant.size;
          const nextColor = field === "color" ? value : variant.color;
          if (nextSize && nextColor) {
            updated.label = `${nextSize} / ${nextColor}`;
          } else if (nextSize) {
            updated.label = nextSize;
          } else if (nextColor) {
            updated.label = nextColor;
          }
        }

        return updated;
      }),
    );
  }

  function buildFormData() {
    // Also persist any used category or variant options for future products
    if (category.trim()) addCategory(category.trim());
    tags.forEach((t) => addTag(t));
    variants.forEach((v) => {
      if (v.size?.trim()) addSize(v.size.trim());
      if (v.color?.trim()) addColor(v.color.trim());
    });

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags.join(", "));
    formData.append("status", status);
    formData.append("lowStockThreshold", String(Number(lowStockThreshold) || 0));
    formData.append(
      "variants",
      JSON.stringify(
        variants.map((variant) => ({
          label:
            variant.label ||
            [variant.size, variant.color].filter(Boolean).join(" / ") ||
            "Standard",
          size: variant.size,
          color: variant.color,
          custom: variant.custom,
          sku: variant.sku,
          price: Number(variant.price) || 0,
          quantity: Number(variant.quantity) || 0,
          sold: variant.sold ?? 0,
        })),
      ),
    );

    Array.from(files ?? []).forEach((file) => formData.append("images", file));
    return formData;
  }



  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = buildFormData();

    if (product) {
      await updateProduct.mutateAsync(formData);
      router.push("/dashboard/products");
      return;
    }

    await createProduct.mutateAsync(formData);
    router.push("/dashboard/products");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="space-y-5 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
        <Input label="Product name" value={name} onChange={(event) => setName(event.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <CreatableCombobox
            label="Category"
            value={category}
            onChange={(val) => setCategory(val)}
            onAddOption={addCategory}
            options={categories}
            placeholder="Select or type category (e.g. Dresses)"
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
          <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}>
              {Object.values(ProductStatus).map((value) => (
                <option key={value} value={value}>{value.replace("_", " ")}</option>
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
          helper={product ? "Existing images stay attached. New uploads are appended." : "Upload up to 5 images (max 15MB each)."}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Variants</h2>
            <p className="text-sm text-gray-500">Track price and stock by size, color, or fabric.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="small"
            leftIcon={<Plus className="size-4" />}
            onClick={() => setVariants((current) => [...current, { ...blankVariant }])}
          >
            Add
          </Button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Variant {index + 1}</span>
                {variants.length > 1 && (
                  <button
                    type="button"
                    className="text-error-600"
                    onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
                    aria-label="Remove variant"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3">
                <Input
                  label="Label"
                  value={variant.label}
                  placeholder="e.g. M / Black or Standard"
                  onChange={(event) => updateVariant(index, "label", event.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <CreatableCombobox
                    label="Size"
                    value={variant.size || ""}
                    onChange={(val) => updateVariant(index, "size", val)}
                    onAddOption={addSize}
                    options={sizes}
                    placeholder="e.g. M, UK 12"
                  />
                  <CreatableCombobox
                    label="Color"
                    value={variant.color || ""}
                    onChange={(val) => updateVariant(index, "color", val)}
                    onAddOption={addColor}
                    options={colors}
                    placeholder="e.g. Emerald Green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={variant.price}
                    onChange={(event) => updateVariant(index, "price", event.target.value)}
                    required
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={variant.quantity}
                    onChange={(event) => updateVariant(index, "quantity", event.target.value)}
                    required
                  />
                </div>
                <Input label="SKU / material note" value={variant.sku || variant.custom || ""} onChange={(event) => updateVariant(index, "sku", event.target.value)} />
              </div>
            </div>
          ))}
        </div>


        <Button type="submit" isLoading={isPending} leftIcon={<Save className="size-4" />} className="w-full">

          {product ? "Save product" : "Create product"}
        </Button>
      </section>
    </form>
  );
}
