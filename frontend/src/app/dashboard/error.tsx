"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log error to monitoring service
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-16 text-center space-y-5">
      <div className="size-16 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200 shadow-xs">
        <AlertTriangle size={30} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-gray-950">Something went wrong</h2>
        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
          {error?.message || "An unexpected error occurred while loading this section of the dashboard."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors shadow-xs"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors"
        >
          Dashboard Home
        </Link>
      </div>
    </div>
  );
}
