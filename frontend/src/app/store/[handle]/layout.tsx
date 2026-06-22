import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, MessageCircle } from "lucide-react";
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar";

async function getVendorStorefront(handle: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
    const res = await fetch(`${apiUrl}/storefront/${handle}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch storefront");
    }
    
    const data = await res.json();
    return data.data; // because our backend wraps it in { success, data }
  } catch (error) {
    return null;
  }
}

// Generate dynamic SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const vendor = await getVendorStorefront(handle);

  if (!vendor) {
    return { title: "Store Not Found" };
  }

  return {
    title: vendor.businessName,
    description: vendor.bio || `Shop products from ${vendor.businessName} on SabiStore.`,
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const vendor = await getVendorStorefront(handle);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <StorefrontNavbar vendor={vendor} />
      
      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-4">{vendor.businessName}</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">{vendor.bio}</p>
          
          <div className="flex justify-center space-x-6 mb-8">
            {vendor.socials?.instagram && (
              <a href={vendor.socials.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            )}
            
            {vendor.socials?.whatsapp && (
              <a href={`https://wa.me/${vendor.socials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">WhatsApp</span>
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </a>
            )}
          </div>
          <p className="text-sm text-gray-400">Powered by <span className="font-semibold text-brand-600">SabiStore</span></p>
        </div>
      </footer>
    </div>
  );
}
