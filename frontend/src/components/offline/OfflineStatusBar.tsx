"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2, ArrowUpRight, CloudUpload } from "lucide-react";
import { useNetworkStore } from "@/store/networkStore";

export default function OfflineStatusBar() {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const isSyncing = useNetworkStore((s) => s.isSyncing);
  const pendingCount = useNetworkStore((s) => s.pendingCount);
  const lastSyncAt = useNetworkStore((s) => s.lastSyncAt);
  const triggerSync = useNetworkStore((s) => s.triggerSync);
  const setDrawerOpen = useNetworkStore((s) => s.setDrawerOpen);

  const [showSyncedNotice, setShowSyncedNotice] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a temporary green "All Synced" notification when transitioning from syncing to idle online
  useEffect(() => {
    if (isOnline && !isSyncing && pendingCount === 0 && lastSyncAt) {
      setShowSyncedNotice(true);
      const timer = setTimeout(() => setShowSyncedNotice(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing, pendingCount, lastSyncAt]);

  // Avoid hydration mismatch by waiting until mounted on client
  if (!mounted) {
    return null;
  }

  // If online, not syncing, no pending items, and not showing the notice: render nothing
  if (isOnline && !isSyncing && pendingCount === 0 && !showSyncedNotice) {
    return null;
  }

  return (
    <aside aria-label="Network & Sync Status" className="w-full z-40 relative animate-in fade-in slide-in-from-top-2 duration-200 mb-3">
      {/* 1. Offline Mode Active */}
      {!isOnline && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
              <WifiOff size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>Working Offline</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-bold">
                    {pendingCount} unsynced
                  </span>
                )}
              </p>
              <p className="text-[11px] text-amber-800/90 leading-tight">
                New demands, measurements, and orders are saved to this device and will sync automatically when back online.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/80 hover:bg-white text-amber-950 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
              >
                View Queue
              </button>
            )}
            <button
              type="button"
              onClick={() => triggerSync()}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Syncing In Progress */}
      {isOnline && isSyncing && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-700 shrink-0 animate-spin">
              <RefreshCw size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-950">
                Syncing with Cloud...
              </p>
              <p className="text-[11px] text-blue-800/90">
                Saving {pendingCount} offline transaction{pendingCount > 1 ? "s" : ""} to your store database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/80 hover:bg-white text-blue-950 border border-blue-300 transition-colors shadow-2xs cursor-pointer"
          >
            Details
          </button>
        </div>
      )}

      {/* 3. Online with Pending Items (waiting to sync or failed items) */}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-700 shrink-0">
              <CloudUpload size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-950">
                {pendingCount} offline item{pendingCount > 1 ? "s" : ""} ready to sync
              </p>
              <p className="text-[11px] text-orange-800/90">
                Connection is active. Tap Sync Now to push records to the server.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/80 hover:bg-white text-orange-950 border border-orange-300 transition-colors shadow-2xs cursor-pointer"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => triggerSync()}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Just Synced Notification */}
      {isOnline && !isSyncing && pendingCount === 0 && showSyncedNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-950">
              All offline changes synced successfully with cloud!
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
