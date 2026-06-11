"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import { useProduct } from "@/hooks/useProducts";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductDetailPage() {
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

  const stock = product.data.variants.reduce((sum, variant) => sum + variant.quantity, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-2 size-4" />
          Back to products
        </Link>
      </div>
      <PageHeader
        title={product.data.name}
        description={`Category: ${product.data.category || "Uncategorized"} · Last updated: ${formatDate(product.data.updatedAt)}`}
        action={
          <Link
            href={`/dashboard/products/${product.data._id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <Edit className="size-4" />
            Edit Product
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">Variants</h2>
              <span className="text-sm font-medium text-gray-500">Total Stock: {stock}</span>
            </div>
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Size/Color</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.data.variants.map((variant, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium text-gray-950">{variant.label}</td>
                      <td className="px-4 py-3">
                        {variant.size || variant.color ? (
                          <div className="flex gap-1">
                            {variant.size && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs">{variant.size}</span>}
                            {variant.color && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs">{variant.color}</span>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(variant.price)}</td>
                      <td className="px-4 py-3">
                        <span className={variant.quantity <= product.data.lowStockThreshold ? "font-semibold text-accent-700" : ""}>
                          {variant.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{variant.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>

          {product.data.images.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="mb-4 text-base font-semibold text-gray-950">Images</h2>
              <div className="flex flex-wrap gap-4">
                {product.data.images.map((img) => (
                  <img
                    key={img.publicId}
                    src={img.url}
                    alt={product.data.name}
                    className="h-32 w-32 rounded-md object-cover border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6 h-fit">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-gray-950">Details</h2>
            <div className="space-y-4">
              <Info label="Status" value={<StatusBadge value={product.data.status} />} />
              <Info label="Base Price" value={formatCurrency(product.data.basePrice)} />
              <Info 
                label="Tags" 
                value={
                  product.data.tags && product.data.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.data.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{tag}</span>
                      ))}
                    </div>
                  ) : "No tags"
                } 
              />
              <Info label="Low Stock Alert" value={`${product.data.lowStockThreshold} units`} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-2 text-base font-semibold text-gray-950">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {product.data.description || "No description provided."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-950">{value}</div>
    </div>
  );
}
