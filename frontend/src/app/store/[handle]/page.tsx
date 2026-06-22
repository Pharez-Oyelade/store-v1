import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

async function getProducts(handle: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
    const res = await fetch(`${apiUrl}/storefront/${handle}/products?limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data.products;
  } catch (error) {
    return [];
  }
}

export default async function StorefrontPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const products = await getProducts(handle);

  if (!products || products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h3 className="text-lg font-medium text-gray-900">No products available</h3>
        <p className="mt-1 text-sm text-gray-500">Check back later for new arrivals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
        {products.map((product: any) => {
          // Find the lowest price across variants
          const minPrice = Math.min(...product.variants.map((v: any) => v.price));
          const totalStock = product.variants.reduce((acc: number, v: any) => acc + v.stockQuantity, 0);

          return (
            <Link key={product._id} href={`/store/${handle}/product/${product._id}`} className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80 transition-opacity">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No image
                  </div>
                )}
                {totalStock <= 0 && (
                  <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                    Sold Out
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(minPrice)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
