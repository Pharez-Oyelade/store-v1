import React from "react";
import { Store, MessageCircle, Sparkles } from "lucide-react";

async function getVendorInfo(handle: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
    const res = await fetch(`${apiUrl}/storefront/${handle}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const vendor = await getVendorInfo(handle);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-14 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto border border-brand-200/60">
          <Store size={32} />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            Storefront Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">
            {vendor?.businessName || `@${handle}`}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            {vendor?.bio ||
              "Our full digital catalog and online ordering experience is launching soon!"}
          </p>
        </div>

        {vendor?.socials?.whatsapp && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">
              Connect Directly with the Designer
            </p>
            <a
              href={`https://wa.me/${vendor.socials.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hello ${vendor.businessName}, I would like to make an inquiry!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm transition-all shadow-md active:scale-98"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

