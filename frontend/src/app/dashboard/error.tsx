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
  const isChunkError =
    error?.message?.toLowerCase().includes("failed to load chunk") ||
    error?.message?.toLowerCase().includes("loading chunk") ||
    error?.name === "ChunkLoadError";

  useEffect(() => {
    console.error("Dashboard error boundary caught error:", error);

    // If chunk loading failed and we are back online, automatically reload once to fetch fresh assets
    if (isChunkError && typeof window !== "undefined" && navigator.onLine) {
      const reloadKey = `vendra_chunk_reload_${error.message}`;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  return (
    <div className="mx-auto max-w-xl py-16 text-center space-y-5">
      <div className="size-16 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200 shadow-xs">
        <AlertTriangle size={30} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-gray-950">Something went wrong</h2>
        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
          {isChunkError
            ? "A page component asset could not be loaded. Click 'Try Again' to refresh the page."
            : error?.message || "An unexpected error occurred while loading this section of the dashboard."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => {
            if (isChunkError) {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
        <button
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
        >
          Dashboard Home
        </button>
      </div>
    </div>
  );
}
