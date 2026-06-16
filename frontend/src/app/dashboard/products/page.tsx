"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit, PackagePlus, Search, Trash2 } from "lucide-react";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  NativeSelect,
  PageHeader,
  StatusBadge,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import {
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductStatus, type Product } from "@/types";
import { PaginationControls } from "@/components/ui/PaginationControls";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const params = useMemo(
    () => ({ page, limit: 10, search, status: status || undefined }),
    [page, search, status],
  );
  const products = useProducts(params);
  const deleteProduct = useDeleteProduct();

  const productList = products.data?.products ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Products"
        description="Manage fashion inventory, variants, stock levels and storefront availability."
        action={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <PackagePlus className="size-4 text-white" />
            <span className="text-white">Add product</span>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          placeholder="Search by name or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftElement={<Search className="size-4" />}
        />
        <NativeSelect
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ProductStatus | "")
          }
        >
          <option value="">All statuses</option>
          {Object.values(ProductStatus).map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </div>

      {productList.length ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-4">
            {productList.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onDelete={() => {
                  if (confirm(`Delete ${product.name}?`))
                    deleteProduct.mutate(product._id);
                }}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productList.map((product) => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      onDelete={() => {
                        if (confirm(`Delete ${product.name}?`))
                          deleteProduct.mutate(product._id);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
          {products.data?.pagination && (
            <PaginationControls
              currentPage={products.data.pagination.page}
              totalPages={products.data.pagination.totalPages}
              hasNextPage={products.data.pagination.hasNextPage}
              hasPrevPage={products.data.pagination.hasPrevPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No products found"
          description="Add your first product with sizes, colors, stock and prices so orders can deplete inventory."
          href="/dashboard/products/new"
          actionLabel="Add product"
        />
      )}
    </div>
  );
}

function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: () => void;
}) {
  const updateProduct = useUpdateProduct(product._id);
  const stock = product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
  const isLow = product.variants.some((variant) => variant.quantity <= product.lowStockThreshold);

  function updateStatus(nextStatus: ProductStatus) {
    const formData = new FormData();
    formData.append("status", nextStatus);
    formData.append("variants", JSON.stringify(product.variants));
    updateProduct.mutate(formData);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/dashboard/products/${product._id}`} className="font-semibold text-gray-900 text-base block hover:underline">
            {product.name}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">{product.category || "Uncategorized"} • {product.variants.length} variants</p>
        </div>
        <StatusBadge value={product.status} />
      </div>

      <div className="flex justify-between items-center py-3 border-y border-gray-50 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Price</p>
          <p className="font-medium text-gray-900">{formatCurrency(product.basePrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5 text-right">Stock</p>
          <p className={`font-medium text-right ${isLow ? 'text-accent-700' : 'text-gray-900'}`}>{stock} units</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <NativeSelect className="flex-1 h-10" value={product.status} onChange={(e) => updateStatus(e.target.value as ProductStatus)}>
          {Object.values(ProductStatus).map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}
        </NativeSelect>
        
        <button
          onClick={onDelete}
          className="flex-shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: () => void;
}) {
  const updateProduct = useUpdateProduct(product._id);
  const stock = product.variants.reduce(
    (sum, variant) => sum + variant.quantity,
    0,
  );
  const isLow = product.variants.some(
    (variant) => variant.quantity <= product.lowStockThreshold,
  );

  function updateStatus(nextStatus: ProductStatus) {
    const formData = new FormData();
    formData.append("status", nextStatus);
    formData.append("variants", JSON.stringify(product.variants));
    updateProduct.mutate(formData);
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <Link href={`/dashboard/products/${product._id}`} className="font-medium text-gray-950 hover:underline">
          {product.name}
        </Link>
        <p className="text-xs text-gray-500">
          {product.category || "Uncategorized"} · {product.variants.length}{" "}
          variants
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={isLow ? "font-semibold text-accent-700" : "text-gray-700"}
        >
          {stock} units
        </span>
      </td>
      <td className="px-4 py-3">{formatCurrency(product.basePrice)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge value={product.status} />
          <NativeSelect
            className="h-8 w-28"
            value={product.status}
            onChange={(event) =>
              updateStatus(event.target.value as ProductStatus)
            }
          >
            {Object.values(ProductStatus).map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </NativeSelect>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">
        {formatDate(product.updatedAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/products/${product._id}/edit`}
            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Edit product"
          >
            <Edit className="size-4" />
          </Link>
          <button
            onClick={onDelete}
            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
            aria-label="Delete product"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
