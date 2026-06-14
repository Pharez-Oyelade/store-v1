"use client";

import Link from "next/link";
import { ExternalLink, Store } from "lucide-react";
import VendorProfileForm from "@/components/dashboard/VendorProfileForm";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import { useProducts } from "@/hooks/useProducts";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { formatCurrency } from "@/lib/utils";
import { ProductStatus } from "@/types";

export default function StorefrontPage() {
  const profile = useVendorProfile();
  const products = useProducts({ page: 1, limit: 20, status: ProductStatus.Active });
  const storefrontPath = profile.data?.handle ? `/store/${profile.data.handle}` : "/store";

  return (
    <div className="mx-auto max-w-7xl relative">
      {(!profile.data?.subscriptionPlan || profile.data?.subscriptionPlan === "free" || profile.data?.subscriptionPlan === "stitch") && (
        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100 dark:border-gray-800">
            <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Public storefronts are available on The Drape, The Atelier, and The Maison plans. Upgrade to unlock your own branded discovery page.
            </p>
            <Link href="/dashboard/settings">
              <button className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 transition">Upgrade Plan</button>
            </Link>
          </div>
        </div>
      )}
      <PageHeader
        title="Storefront"
        description="Control the public details buyers see before they continue on WhatsApp or Instagram."
        action={
          <Link href={storefrontPath} className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ExternalLink className="size-4" />
            Preview
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-950">Storefront profile</h2>
          <VendorProfileForm />
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <Store className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-950">{profile.data?.businessName ?? "Your store"}</h2>
                <p className="text-sm text-gray-500">@{profile.data?.handle ?? "handle"}</p>
                <p className="mt-3 text-sm text-gray-600">{profile.data?.bio || "Add a short bio to help buyers understand your style and services."}</p>
                <p className="mt-3 text-xs text-gray-500">
                  {[profile.data?.location?.area, profile.data?.location?.city, profile.data?.location?.state].filter(Boolean).join(", ") || "Location not set"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-gray-950">Active products on storefront</h2>
            {products.data?.products.length ? (
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.data.products.map((product) => (
                      <tr key={product._id}>
                        <td className="px-4 py-3 font-medium text-gray-950">{product.name}</td>
                        <td className="px-4 py-3">{formatCurrency(product.basePrice)}</td>
                        <td className="px-4 py-3">{product.variants.reduce((sum, variant) => sum + variant.quantity, 0)}</td>
                        <td className="px-4 py-3"><StatusBadge value={product.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <EmptyState
                title="No active products"
                description="Set products to active so buyers can see them on your public storefront."
                href="/dashboard/products"
                actionLabel="Manage products"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
