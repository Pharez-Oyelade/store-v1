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
import { ProductStatus, type Product, type ProductVariant } from "@/types";

type VariantDraft = Omit<ProductVariant, "sold"> & { sold?: number };

const blankVariant: VariantDraft = {
  label: "",
  size: "",
  color: "",
  custom: "",
  sku: "",
  price: 0,
  quantity: 0,
};

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?._id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.Draft);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [variants, setVariants] = useState<VariantDraft[]>([blankVariant]);
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setCategory(product.category ?? "");
    setTags(product.tags?.join(", ") ?? "");
    setStatus(product.status);
    setLowStockThreshold(product.lowStockThreshold);
    setVariants(product.variants.map((variant) => ({ ...variant })));
  }, [product]);

  const isPending = createProduct.isPending || updateProduct.isPending;

  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: field === "price" || field === "quantity" ? Number(value) : value,
            }
          : variant,
      ),
    );
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("status", status);
    formData.append("lowStockThreshold", String(lowStockThreshold));
    formData.append(
      "variants",
      JSON.stringify(
        variants.map((variant) => ({
          label: variant.label,
          size: variant.size,
          color: variant.color,
          custom: variant.custom,
          sku: variant.sku,
          price: Number(variant.price),
          quantity: Number(variant.quantity),
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
          <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <Input label="Tags" helper="Comma-separated" value={tags} onChange={(event) => setTags(event.target.value)} />
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
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(Number(event.target.value))}
          />
        </div>
        <Input
          label={product ? "Add more images" : "Product images"}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          helper={product ? "Existing images stay attached. New uploads are appended." : "Upload up to 5 images."}
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
                <Input label="Label" value={variant.label} onChange={(event) => updateVariant(index, "label", event.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Size" value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} />
                  <Input label="Color" value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Price" type="number" min={0} value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} required />
                  <Input label="Quantity" type="number" min={0} value={variant.quantity} onChange={(event) => updateVariant(index, "quantity", event.target.value)} required />
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
