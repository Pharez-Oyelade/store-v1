import Link from "next/link";
import { Store } from "lucide-react";

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Store className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Store Not Found</h1>
        <p className="text-gray-500 mb-8">
          The storefront you are looking for doesn't exist or is currently unavailable. 
          Please check the link and try again.
        </p>
        <Link 
          href="/"
          className="block w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-800 transition-colors"
        >
          Return to SabiStore
        </Link>
      </div>
    </div>
  );
}
