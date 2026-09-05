"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Scissors,
  X,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface PostCreationInvoiceModalProps {
  isOpen: boolean;
  type: "order" | "demand";
  id: string;
  referenceNumber?: string;
  title?: string;
  customerName: string;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  onDismiss: () => void;
}

export default function PostCreationInvoiceModal({
  isOpen,
  type,
  id,
  referenceNumber,
  title,
  customerName,
  totalAmount,
  depositPaid,
  balanceDue,
  onDismiss,
}: PostCreationInvoiceModalProps) {
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const isOrder = type === "order";
  const invoiceUrl = isOrder
    ? `/dashboard/invoices/new?orderId=${id}`
    : `/dashboard/invoices/new?demandId=${id}`;
  const detailUrl = isOrder
    ? `/dashboard/orders/${id}`
    : `/dashboard/demands/${id}`;

  const handleGenerateInvoice = () => {
    router.push(invoiceUrl);
  };

  const handleViewDetail = () => {
    router.push(detailUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shrink-0">
            {isOrder ? (
              <ShoppingBag className="w-6 h-6" />
            ) : (
              <Scissors className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 mb-0.5">
              <CheckCircle2 className="w-3 h-3" />
              {isOrder ? "Order Created" : "Demand Recorded"}
            </span>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              Generate Customer Invoice?
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Would you like to generate a live, shareable invoice tied to this{" "}
          {isOrder ? "order" : "bespoke demand"}? You can send the live link to{" "}
          <span className="font-semibold text-gray-900">{customerName || "your customer"}</span>{" "}
          via WhatsApp to collect payments and track settlements.
        </p>

        {/* Order / Demand Summary Pill */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              {isOrder ? "Order Reference" : "Demand Title"}
            </span>
            <span className="font-mono font-bold text-gray-900 truncate max-w-[180px]">
              {referenceNumber || title || (isOrder ? "Order" : "Bespoke Garment")}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Total</p>
              <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-2xs">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Deposit</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5 truncate">
                {formatCurrency(depositPaid)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-100 shadow-2xs">
              <p className="text-[10px] text-brand-600 font-semibold uppercase">Balance</p>
              <p className="text-xs font-bold text-brand-700 mt-0.5 truncate">
                {formatCurrency(balanceDue)}
              </p>
            </div>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="bg-brand-50/60 rounded-xl p-3 border border-brand-100/80 text-[11px] text-brand-900 space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-brand-700 shrink-0" />
            <span>Card, USSD & direct bank transfers settle automatically</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-700 shrink-0" />
            <span>0% platform fee • 100% settles directly to your bank account</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGenerateInvoice}
            className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Generate & Send Invoice</span>
            <ArrowRight className="w-4 h-4 text-white ml-0.5" />
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleViewDetail}
              className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              View {isOrder ? "Order" : "Demand"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="py-2.5 px-4 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
