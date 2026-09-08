"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Scissors, ShoppingCart, Package } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
          <WifiOff size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">You are Offline</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your device is currently disconnected from the internet. You can still access your previously loaded workspace data, take measurements, and record orders.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Available Cached Sections
          </p>
          <div className="grid grid-cols-1 gap-2 text-left">
            <Link
              href="/dashboard/demands"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-xs font-bold text-gray-900"
            >
              <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Scissors size={16} />
              </div>
              <div>
                <p>Bespoke Demands & Measurements</p>
                <p className="text-[10px] text-gray-400 font-normal">View and create tailored requests</p>
              </div>
            </Link>

            <Link
              href="/dashboard/orders"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-xs font-bold text-gray-900"
            >
              <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart size={16} />
              </div>
              <div>
                <p>Orders Register</p>
                <p className="text-[10px] text-gray-400 font-normal">Log in-person sales and payments</p>
              </div>
            </Link>

            <Link
              href="/dashboard/products"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-xs font-bold text-gray-900"
            >
              <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package size={16} />
              </div>
              <div>
                <p>Products & Inventory</p>
                <p className="text-[10px] text-gray-400 font-normal">Browse catalog and stock items</p>
              </div>
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
