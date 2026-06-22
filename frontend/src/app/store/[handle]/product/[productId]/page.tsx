import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "@/components/storefront/ProductDetailsClient";

async function getProduct(handle: string, productId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
    const res = await fetch(`${apiUrl}/storefront/${handle}/products/${productId}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; productId: string }>;
}): Promise<Metadata> {
  const { handle, productId } = await params;
  const product = await getProduct(handle, productId);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description || `Buy ${product.name} on SabiStore.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; productId: string }>;
}) {
  const { handle, productId } = await params;
  const product = await getProduct(handle, productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ProductDetailsClient product={product} handle={handle} />
    </div>
  );
}
