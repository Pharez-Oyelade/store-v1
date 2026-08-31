"use client";

import React from "react";
import Link from "next/link";
import { Store, Sparkles, Package, Scissors, MessageCircle, ArrowRight } from "lucide-react";
import Button from "@/components/custom/Button";
import { PageHeader } from "@/components/dashboard/DashboardPrimitives";

export default function StorefrontPage() {
  return (
    <div className="mx-auto max-w-4xl pb-16 space-y-8">
      <PageHeader
        title="Public Storefronts"
        description="Your dedicated online store and digital fashion catalog for customer discovery."
      />

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-xs">
          <Store size={32} />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            Feature Coming Soon
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Public Online Storefronts are in Development
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed pt-1">
            We are currently building branded web storefronts with customer carts and custom domain connections. This feature will roll out to all vendors in a future update!
          </p>
        </div>

        {/* What vendors can use right now */}
        <div className="pt-6 border-t border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Available on Vendra Today
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Link
              href="/dashboard/products"
              className="p-4 rounded-2xl bg-gray-50 hover:bg-brand-50/50 border border-gray-200 transition-colors group block"
            >
              <Package size={20} className="text-brand-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-gray-900">Product Inventory</h4>
              <p className="text-xs text-gray-500 mt-1">Manage stock, prices, and sizes for ready-to-wear.</p>
            </Link>

            <Link
              href="/dashboard/demands"
              className="p-4 rounded-2xl bg-gray-50 hover:bg-brand-50/50 border border-gray-200 transition-colors group block"
            >
              <Scissors size={20} className="text-brand-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-gray-900">Bespoke Demands</h4>
              <p className="text-xs text-gray-500 mt-1">Record client measurements, fabrics, and deadlines.</p>
            </Link>

            <Link
              href="/dashboard/orders"
              className="p-4 rounded-2xl bg-gray-50 hover:bg-brand-50/50 border border-gray-200 transition-colors group block"
            >
              <MessageCircle size={20} className="text-brand-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold text-gray-900">Orders & WhatsApp</h4>
              <p className="text-xs text-gray-500 mt-1">Track deposits, debts, and send 1-click updates.</p>
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
              Go to Dashboard Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

