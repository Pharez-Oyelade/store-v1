"use client";

import { useParams } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/dashboard/DashboardPrimitives";
import ProductForm from "@/components/dashboard/ProductForm";
import { useProduct } from "@/hooks/useProducts";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const product = useProduct(params.id);

  if (product.isLoading) return <p className="text-sm text-gray-500">Loading product...</p>;
  if (!product.data) {
    return (
      <EmptyState
        title="Product not found"
        description="This product may have been deleted or belongs to another vendor account."
        href="/dashboard/products"
        actionLabel="Back to products"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Edit product" description="Update stock, price, visibility and product details." />
      <ProductForm product={product.data} />
    </div>
  );
}
