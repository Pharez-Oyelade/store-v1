"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Landmark,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useInvoices, usePayoutAccount } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { InvoiceStatus } from "@/types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Invoices", value: "all" },
  { label: "Awaiting Payment", value: "issued" },
  { label: "Partially Paid", value: "partially_paid" },
  { label: "Paid in Full", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
];

export default function InvoicesListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data, isLoading } = useInvoices({
    page,
    limit: 20,
    status: statusFilter,
    search: searchTerm,
  });

  const { data: payoutAccount, isLoading: isLoadingPayout } =
    usePayoutAccount();
  const isBankLinked = Boolean(
    payoutAccount?.isVerified && payoutAccount?.paystackSubaccountCode,
  );
  const isBrandNewUser =
    !isLoading &&
    !isLoadingPayout &&
    (data?.metrics?.totalCount ?? 0) === 0 &&
    !searchTerm &&
    statusFilter === "all";

  const invoices = data?.invoices || [];
  const metrics = data?.metrics || {
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalCount: 0,
  };

  const handleCopyLink = (e: React.MouseEvent, token: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/i/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Live invoice link copied!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleWhatsAppShare = (e: React.MouseEvent, inv: any) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/i/${inv.accessToken}`;
    const custName = inv.customerSnapshot?.name || "Valued Customer";
    const phone = inv.customerSnapshot?.phone?.replace(/[^0-9]/g, "") || "";

    const message = `Hi ${custName}, here is your live invoice #${inv.invoiceNumber}.\n\nTotal: ${formatCurrency(
      inv.totalAmount,
    )}\nBalance Due: ${formatCurrency(inv.balanceDue)}\n\n👉 View invoice, pay online, or see transfer details here:\n${url}`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-brand-600" />
            <span>Invoices</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate dynamic live invoices, send persistent links via WhatsApp,
            and track customer settlements.
          </p>
        </div>

        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">New Invoice</span>
        </Link>
      </div>

      {/* New User Onboarding: Setup Settlement Account Banner */}
      {!isBankLinked && isBrandNewUser && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-900 via-indigo-950 to-brand-900 p-6 sm:p-7 text-white shadow-md border border-brand-800">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Landmark size={14} className="text-emerald-400" />
              <span>Recommended First Step • Direct Payouts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Connect your bank account to start receiving invoice payments
            </h2>
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              Before sending invoices to your customers, connect your Nigerian
              bank account. Customer payments made online (Card, USSD, Apple
              Pay) or via direct bank transfer settle directly into your account
              with 0% platform commission.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard/settings?tab=payouts"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-950 hover:bg-brand-50 transition-colors shadow-xs cursor-pointer"
              >
                <Landmark className="size-4 text-brand-700" />
                <span className="text-brand-950">
                  Link Settlement Bank Account
                </span>
                <ArrowRight className="size-3.5 text-brand-700" />
              </Link>
              <Link
                href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition-colors border border-white/20 cursor-pointer"
              >
                <Plus className="size-4 text-white" />
                <span>Create First Invoice</span>
              </Link>
            </div>
          </div>
          <Building2 className="absolute -right-6 -bottom-6 size-48 text-white/5 pointer-events-none" />
        </div>
      )}

      {/* Existing Invoices without Linked Payout Account Warning */}
      {!isBankLinked && !isBrandNewUser && !isLoading && !isLoadingPayout && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                Settlement bank account not connected
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Customers viewing your invoices cannot pay online or see your
                transfer details until you link your Nigerian bank account in
                Settings.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=payouts"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
          >
            <span>Connect Bank</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Total Invoiced</p>
          <p className="text-xl font-extrabold text-gray-900 mt-1">
            {formatCurrency(metrics.totalInvoiced)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {metrics.totalCount} total invoices
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Total Collected</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(metrics.totalCollected)}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">
            Cleared into balance
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">
            Outstanding Balances
          </p>
          <p className="text-xl font-extrabold text-brand-600 mt-1">
            {formatCurrency(metrics.totalOutstanding)}
          </p>
          <p className="text-[11px] text-brand-500 mt-0.5">
            Awaiting customer payment
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Collection Rate</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">
            {metrics.totalInvoiced > 0
              ? `${Math.round((metrics.totalCollected / metrics.totalInvoiced) * 100)}%`
              : "100%"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Paid vs Total</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          !isBankLinked && isBrandNewUser ? (
            <div className="p-10 sm:p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="size-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center mx-auto border border-brand-200 shadow-xs">
                <Landmark className="size-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-gray-900">
                  Ready to send your first invoice?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Connect your settlement bank account so customer payments
                  settle directly into your account with 0% platform fee, then
                  generate your first dynamic invoice.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <Link
                  href="/dashboard/settings?tab=payouts"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Landmark className="size-4 text-white" />
                  <span className="text-white">Connect Bank Account</span>
                </Link>
                <Link
                  href="/dashboard/invoices/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="size-4 text-gray-600" />
                  <span>Create First Invoice</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl text-gray-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">
                No invoices found
              </p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Create an invoice for a customer order or tailoring demand to
                share a live payment link.
              </p>
              <Link
                href="/dashboard/invoices/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span className="text-white">Create First Invoice</span>
              </Link>
            </div>
          )
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const hasProof = inv.manualPaymentProofs?.some(
                (p) => p.status === "pending",
              );

              return (
                <Link
                  key={inv._id}
                  href={`/dashboard/invoices/${inv._id}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors block group"
                >
                  {/* Customer and Invoice Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.status === "partially_paid"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : inv.status === "cancelled"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {inv.customerSnapshot?.name}
                        </span>
                        {hasProof && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            Proof Pending
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5">
                        Issued {formatDate(inv.createdAt)} •{" "}
                        {inv.items?.length || 1} item(s)
                      </p>
                    </div>
                  </div>

                  {/* Financials & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      <p
                        className={`text-xs font-semibold mt-0.5 ${
                          inv.balanceDue > 0
                            ? "text-brand-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {inv.balanceDue > 0
                          ? `Due: ${formatCurrency(inv.balanceDue)}`
                          : "Paid in full"}
                      </p>
                    </div>

                    {/* Quick Link Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, inv.accessToken)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Copy Live Link"
                      >
                        {copiedToken === inv.accessToken ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppShare(e, inv)}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors ml-1 hidden sm:block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
