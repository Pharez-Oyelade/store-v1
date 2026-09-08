"use client";

import React, { useEffect } from "react";
import {
  X,
  RefreshCw,
  Trash2,
  Scissors,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Handshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { useNetworkStore } from "@/store/networkStore";
import { QueuedMutation, EntityType } from "@/lib/offline/outbox";
import { formatDate } from "@/lib/utils";

function getEntityIcon(type: EntityType) {
  switch (type) {
    case "demand":
      return <Scissors size={16} className="text-purple-600" />;
    case "order":
      return <ShoppingCart size={16} className="text-blue-600" />;
    case "product":
      return <Package size={16} className="text-emerald-600" />;
    case "invoice":
      return <FileText size={16} className="text-amber-600" />;
    case "customer":
      return <Users size={16} className="text-rose-600" />;
    case "supplier":
      return <Handshake size={16} className="text-indigo-600" />;
    default:
      return <Package size={16} className="text-gray-600" />;
  }
}

export default function SyncCenterDrawer() {
  const isDrawerOpen = useNetworkStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useNetworkStore((s) => s.setDrawerOpen);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const isSyncing = useNetworkStore((s) => s.isSyncing);
  const pendingCount = useNetworkStore((s) => s.pendingCount);
  const mutations = useNetworkStore((s) => s.mutations);
  const triggerSync = useNetworkStore((s) => s.triggerSync);
  const removeItem = useNetworkStore((s) => s.removeItem);
  const refreshQueue = useNetworkStore((s) => s.refreshQueue);

  useEffect(() => {
    if (isDrawerOpen) {
      refreshQueue();
    }
  }, [isDrawerOpen, refreshQueue]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Offline Sync Center</h2>
              <p className="text-[11px] text-gray-500">
                {pendingCount} pending offline action{pendingCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="size-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Network Status Overview Card */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Wifi size={14} />
                  Connected to Internet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <WifiOff size={14} />
                  Device is Offline
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isSyncing || !isOnline}
              onClick={() => triggerSync()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Syncing..." : "Sync All Now"}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Changes made offline are queued locally. When connected, they are automatically uploaded in order of creation.
          </p>
        </div>

        {/* Mutation Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {mutations.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">All Changes Synced</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                  Your device is completely in sync with your store cloud database.
                </p>
              </div>
            </div>
          ) : (
            mutations.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="size-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      {getEntityIcon(item.entityType)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {item.description || `${item.method} ${item.entityType}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(item.createdAt)}
                        </span>
                        {item.blobIds && item.blobIds.length > 0 && (
                          <span className="text-indigo-600 font-medium">
                            • {item.blobIds.length} image{item.blobIds.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    title="Discard from queue"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Status Pill */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-50">
                  <span className="text-gray-400 font-mono text-[10px] uppercase">
                    {item.entityType}
                  </span>
                  {item.status === "syncing" && (
                    <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-[10px]">
                      <RefreshCw size={10} className="animate-spin" />
                      Syncing...
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded">
                      <Clock size={10} />
                      Pending sync
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-[10px] bg-red-50 px-1.5 py-0.5 rounded" title={item.error}>
                      <AlertTriangle size={10} />
                      Error: {item.error || "Sync failed"}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {mutations.length} total queued
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
