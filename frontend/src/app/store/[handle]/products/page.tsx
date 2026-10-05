import React from "react";
import { notFound } from "next/navigation";
import { getServerApiUrl } from "@/lib/api";
import { ProductsCatalogClient } from "@/components/storefront/ProductsCatalogClient";

async function getVendorInfo(handle: string) {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/storefront/${handle}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getVendorProducts(handle: string) {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/storefront/${handle}/products?limit=100`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.products || [];
  } catch {
    return [];
  }
}

export default async function ProductsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { handle } = await params;
  const { category } = await searchParams;

  const [vendor, products] = await Promise.all([
    getVendorInfo(handle),
    getVendorProducts(handle),
  ]);

  if (!vendor) {
    notFound();
  }

  return (
    <ProductsCatalogClient
      handle={handle}
      initialProducts={products}
      vendorName={vendor.businessName}
      initialCategory={category || "all"}
      accentColor={vendor.storefrontSettings?.accentColor || "#E11D48"}
    />
  );
}
