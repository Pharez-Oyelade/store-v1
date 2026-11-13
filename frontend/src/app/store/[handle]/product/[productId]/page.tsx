import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "@/components/storefront/ProductDetailsClient";
import { getServerApiUrl } from "@/lib/api";

async function getProductData(handle: string, productId: string) {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(
      `${apiUrl}/storefront/${handle}/products/${productId}`,
      {
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data; // { product, vendor }
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
  const data = await getProductData(handle, productId);

  if (!data?.product) {
    return { title: "Product Not Found | Vendra" };
  }

  const { product, vendor } = data;
  const storeName = vendor?.businessName || "Official Store";
  const title = `${product.name} | ${storeName}`;
  const description =
    product.description?.slice(0, 160) ||
    `Shop ${product.name} from ${storeName} on Vendra. Premium Nigerian fashion and handcrafted designs.`;

  const primaryImage = product.images?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: primaryImage
        ? [
            {
              url: primaryImage,
              width: 800,
              height: 1000,
              alt: product.name,
            },
          ]
        : [{ url: "/og-image.png" }],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; productId: string }>;
}) {
  const { handle, productId } = await params;
  const data = await getProductData(handle, productId);

  if (!data?.product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProductDetailsClient
        product={data.product}
        vendor={data.vendor}
        handle={handle}
      />
    </div>
  );
}
