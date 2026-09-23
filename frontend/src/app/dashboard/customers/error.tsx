"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Customers section error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-12 text-center space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="size-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
        <AlertTriangle size={26} />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Failed to load customers</h2>
        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
          {error?.message || "An unexpected error occurred while loading customer records."}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Retry Customers</span>
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
        >
          Dashboard Home
        </Link>
      </div>
    </div>
  );
}
