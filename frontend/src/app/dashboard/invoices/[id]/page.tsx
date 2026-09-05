"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Calendar,
  Clock,
  Send,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  useInvoice,
  useRecordManualPayment,
  useVerifyPaymentProof,
  useCancelInvoice,
} from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: invoice, isLoading, error } = useInvoice(id);
  const recordPayment = useRecordManualPayment();
  const verifyProof = useVerifyPaymentProof();
  const cancelInvoice = useCancelInvoice();

  const [copiedLink, setCopiedLink] = useState(false);
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payChannel, setPayChannel] = useState("bank_transfer");
  const [payNotes, setPayNotes] = useState("");

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs text-gray-500">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-sm font-bold text-gray-800">Invoice not found</p>
        <Link
          href="/dashboard/invoices"
          className="text-xs text-brand-600 font-semibold hover:underline"
        >
          &larr; Back to Invoices
        </Link>
      </div>
    );
  }

  const liveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/i/${invoice.accessToken}`
      : `/i/${invoice.accessToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    toast.success("Live customer link copied!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const custName = invoice.customerSnapshot?.name || "Valued Customer";
    const phone = invoice.customerSnapshot?.phone?.replace(/[^0-9]/g, "") || "";

    const message = `Hi ${custName}, here is your live invoice #${invoice.invoiceNumber}.\n\nTotal: ${formatCurrency(
      invoice.totalAmount,
    )}\nBalance Due: ${formatCurrency(invoice.balanceDue)}\n\n View invoice, pay online, or see transfer details here:\n${liveUrl}`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await recordPayment.mutateAsync({
        id: invoice._id,
        amount: amt,
        channel: payChannel,
        notes: payNotes,
      });
      setShowManualPayModal(false);
      setPayAmount("");
      setPayNotes("");
    } catch {
      // toast error handled in hook
    }
  };

  const handleCancelInvoice = async () => {
    if (confirm("Are you sure you want to cancel this invoice?")) {
      try {
        await cancelInvoice.mutateAsync(invoice._id);
      } catch {
        // Handled
      }
    }
  };

  const pendingProofs =
    invoice.manualPaymentProofs?.filter((p) => p.status === "pending") || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  invoice.status === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : invoice.status === "partially_paid"
                      ? "bg-blue-100 text-blue-800"
                      : invoice.status === "cancelled"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-100 text-amber-800"
                }`}
              >
                {invoice.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Issued on {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Print invoice"
          >
            <Printer className="w-4 h-4" />
          </button>

          {invoice.totalPaid === 0 && invoice.status !== "cancelled" && (
            <button
              type="button"
              onClick={handleCancelInvoice}
              disabled={cancelInvoice.isPending}
              className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              title="Cancel invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Shareable Link Card */}
      <div className="bg-brand-50/60 rounded-2xl p-5 border border-brand-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
              Live Customer Invoice Link
            </h2>
            <p className="text-xs text-brand-700/80 mt-0.5">
              Send this single link to your customer. It automatically reflects
              deposits and balances in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-brand-200 hover:bg-brand-50 text-brand-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <a
              href={`/i/${invoice.accessToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white border border-brand-200 hover:bg-brand-50 text-brand-800 text-xs transition-colors"
              title="Preview Customer Page"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Pending Payment Proofs Alert (Customer submitted bank transfer) */}
      {pendingProofs.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Customer Bank Transfer Proofs ({pendingProofs.length})</span>
          </div>

          <div className="space-y-3">
            {pendingProofs.map((proof) => (
              <div
                key={proof._id}
                className="bg-white p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(proof.amount)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Sender:{" "}
                    <span className="font-semibold">
                      {proof.bankSenderName || "Customer"}
                    </span>
                    {proof.reference && (
                      <span className="text-gray-400 ml-2">
                        Ref: {proof.reference}
                      </span>
                    )}
                  </p>
                  {proof.notes && (
                    <p className="text-[11px] text-gray-500 italic mt-0.5">
                      &quot;{proof.notes}&quot;
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Submitted {formatDate(proof.submittedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      verifyProof.mutate({
                        invoiceId: invoice._id,
                        proofId: proof._id,
                        action: "reject",
                      })
                    }
                    disabled={verifyProof.isPending}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      verifyProof.mutate({
                        invoiceId: invoice._id,
                        proofId: proof._id,
                        action: "approve",
                      })
                    }
                    disabled={verifyProof.isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Credit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Overview Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Total Invoiced</p>
          <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
            {formatCurrency(invoice.totalAmount)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Total Cleared</p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(invoice.totalPaid)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs">
          <p className="text-xs font-semibold text-gray-400">Balance Due</p>
          <p
            className={`text-lg sm:text-xl font-extrabold mt-1 ${
              invoice.balanceDue > 0 ? "text-brand-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(invoice.balanceDue)}
          </p>
        </div>
      </div>

      {/* Customer & Order Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Customer Snapshot
          </h3>
          <p className="text-sm font-bold text-gray-900">
            {invoice.customerSnapshot?.name}
          </p>
          {invoice.customerSnapshot?.phone && (
            <p className="text-xs text-gray-600">
              {invoice.customerSnapshot.phone}
            </p>
          )}
          {invoice.customerSnapshot?.email && (
            <p className="text-xs text-gray-600">
              {invoice.customerSnapshot.email}
            </p>
          )}
          {invoice.customerSnapshot?.address && (
            <p className="text-xs text-gray-500">
              {invoice.customerSnapshot.address}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Invoice Context
          </h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <span className="text-gray-400">Created:</span>{" "}
              {formatDate(invoice.createdAt)}
            </p>
            {invoice.dueDate && (
              <p>
                <span className="text-gray-400">Due Date:</span>{" "}
                {formatDate(invoice.dueDate)}
              </p>
            )}
            {invoice.order && (
              <p>
                <span className="text-gray-400">Linked Order:</span>{" "}
                <Link
                  href={`/dashboard/orders`}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  View Order
                </Link>
              </p>
            )}
            {invoice.customRequest && (
              <p>
                <span className="text-gray-400">Linked Bespoke Demand:</span>{" "}
                <Link
                  href={`/dashboard/demands`}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  View Bespoke Demand
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Invoice Items
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {invoice.items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {item.description}
                </p>
                {item.variantLabel && (
                  <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 font-medium mt-0.5">
                    {item.variantLabel}
                  </span>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="text-xs font-bold text-gray-900">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Receipts & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Payment Receipts ({invoice.paymentHistory?.length || 0})
          </h3>

          {invoice.balanceDue > 0 && invoice.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => {
                setPayAmount(invoice.balanceDue);
                setShowManualPayModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}
        </div>

        {invoice.paymentHistory && invoice.paymentHistory.length > 0 ? (
          <div className="space-y-2.5">
            {invoice.paymentHistory.map((pmt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(pmt.amount)}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {pmt.verifiedBy === "paystack"
                        ? "Paystack Online"
                        : "Manual POS/Cash"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDate(pmt.paidAt)} • Ref: {pmt.reference}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No payments recorded yet.
          </p>
        )}
      </div>

      {/* Manual Payment Recording Modal */}
      {showManualPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Record Manual Payment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Credit funds received in cash, POS, or verified bank transfer.
            </p>

            <form onSubmit={handleManualPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Received (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  max={invoice.balanceDue}
                  required
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="cash">Cash / In-Person</option>
                  <option value="pos">In-Store POS Terminal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid at fitting session"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualPayModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPayment.isPending}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {recordPayment.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Record & Credit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
