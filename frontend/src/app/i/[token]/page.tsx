"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  Copy,
  Check,
  Phone,
  MessageCircle,
  AlertCircle,
  FileText,
  Download,
  Send,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  usePublicInvoice,
  useInitializeInvoicePayment,
  useSubmitManualProof,
} from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [activeTab, setActiveTab] = useState<"card" | "transfer">("card");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState<number | "">("");

  // Transfer Proof Form
  const [transferSender, setTransferSender] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Poll every 4 seconds if pending proof or awaiting balance
  const { data: invoice, isLoading, error, refetch } = usePublicInvoice(token, 4000);

  const initPayment = useInitializeInvoicePayment();
  const submitProof = useSubmitManualProof();

  // Set default pay amount once invoice loads
  useEffect(() => {
    if (invoice && customPayAmount === "") {
      // If partially paid, suggest balance; if deposit required, suggest deposit
      if (invoice.balanceDue > 0) {
        if (invoice.totalPaid === 0 && invoice.depositRequired > 0) {
          setCustomPayAmount(invoice.depositRequired);
        } else {
          setCustomPayAmount(invoice.balanceDue);
        }
      }
    }
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">
            This invoice link is either expired, cancelled, or incorrect. Please contact the vendor for an updated link.
          </p>
        </div>
      </div>
    );
  }

  const vendor = typeof invoice.vendor === "object" ? invoice.vendor : null;
  const isPaid = invoice.status === "paid" || invoice.balanceDue <= 0;
  const isPartiallyPaid = invoice.status === "partially_paid" && invoice.balanceDue > 0;
  const hasPendingProof = invoice.manualPaymentProofs?.some((p) => p.status === "pending");

  const handleCopyAccount = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedAccount(true);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handlePayOnline = async () => {
    const amount = Number(customPayAmount) || invoice.balanceDue;
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const res = await initPayment.mutateAsync({
        token,
        amount,
        email: invoice.customerSnapshot?.email,
      });

      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        toast.error("Could not initialize payment gateway");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize payment");
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customPayAmount) || invoice.balanceDue;

    if (!transferSender.trim()) {
      toast.error("Please enter the sender's account name");
      return;
    }

    try {
      await submitProof.mutateAsync({
        token,
        amount,
        bankSenderName: transferSender.trim(),
        reference: transferRef.trim(),
        notes: transferNotes.trim(),
      });
      setShowTransferModal(false);
      setTransferSender("");
      setTransferRef("");
      setTransferNotes("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit transfer proof");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {vendor?.logo?.url ? (
              <Image
                src={vendor.logo.url}
                alt={vendor.businessName || "Vendor"}
                width={52}
                height={52}
                className="w-13 h-13 rounded-2xl object-cover border border-gray-100 shadow-2xs"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-brand-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
                {(vendor?.businessName || "V")[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {vendor?.businessName || "Official Merchant"}
                </h1>
                <ShieldCheck className="w-4 h-4 text-brand-600" />
              </div>
              <p className="text-xs text-gray-500">
                Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          {/* Quick Contact Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {vendor?.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                title="Call Vendor"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {vendor?.phone && (
              <a
                href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${vendor.businessName}, I am viewing invoice #${invoice.invoiceNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Status Alert Banner */}
        <div
          className={`rounded-3xl p-6 text-white shadow-md relative overflow-hidden ${
            isPaid
              ? "bg-gradient-to-r from-emerald-600 to-teal-700"
              : isPartiallyPaid
              ? "bg-gradient-to-r from-blue-600 to-indigo-700"
              : "bg-gradient-to-r from-slate-900 to-slate-800"
          }`}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs uppercase tracking-wider mb-2">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Paid in Full
                  </>
                ) : isPartiallyPaid ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-blue-200" /> Partially Paid
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-amber-300" /> Payment Due
                  </>
                )}
              </span>

              <p className="text-xs text-white/70">Remaining Balance</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {formatCurrency(invoice.balanceDue)}
              </h2>

              {invoice.totalPaid > 0 && (
                <p className="text-xs text-white/80 mt-1">
                  Paid so far: {formatCurrency(invoice.totalPaid)} of {formatCurrency(invoice.totalAmount)}
                </p>
              )}
            </div>

            {isPaid ? (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Save Receipt</span>
              </button>
            ) : hasPendingProof ? (
              <div className="px-3.5 py-2 rounded-xl bg-amber-500/30 border border-amber-300/40 text-xs text-amber-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Transfer proof submitted & awaiting vendor verification</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Customer Snapshot Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Billed To
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-base">
                {invoice.customerSnapshot?.name}
              </p>
              {invoice.customerSnapshot?.phone && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {invoice.customerSnapshot.phone}
                </p>
              )}
              {invoice.customerSnapshot?.email && (
                <p className="text-xs text-gray-500">
                  {invoice.customerSnapshot.email}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right text-xs text-gray-500">
              <p>Issued: {formatDate(invoice.createdAt)}</p>
              {invoice.dueDate && (
                <p className="text-red-600 font-medium mt-0.5">
                  Due by: {formatDate(invoice.dueDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Order Details */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/70 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Itemized Breakdown</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.description}
                  </p>
                  {item.variantLabel && (
                    <span className="inline-block px-2 py-0.5 text-[11px] rounded-md bg-gray-100 text-gray-600 font-medium mt-1">
                      {item.variantLabel}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="p-6 bg-slate-50/70 space-y-2.5 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            {invoice.totalPaid > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Payments & Deposits Cleared</span>
                <span>- {formatCurrency(invoice.totalPaid)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-extrabold text-gray-900">
              <span>Balance Outstanding</span>
              <span className={invoice.balanceDue > 0 ? "text-brand-600" : "text-emerald-600"}>
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Timeline (if any) */}
        {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/70">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Payment Receipts ({invoice.paymentHistory.length})</span>
            </h3>
            <div className="space-y-3">
              {invoice.paymentHistory.map((pmt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(pmt.amount)}
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {formatDate(pmt.paidAt)} • via {pmt.channel.replace("_", " ")}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Action Hub (Only if balance is due) */}
        {!isPaid && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/70 space-y-6">
            <h3 className="text-sm font-bold text-gray-900">Choose Payment Method</h3>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "card"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>Card / USSD / Online</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("transfer")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "transfer"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* Amount to Pay selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Amount to Pay (₦)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customPayAmount}
                  onChange={(e) =>
                    setCustomPayAmount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  max={invoice.balanceDue}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter amount"
                />
                {invoice.totalPaid === 0 &&
                  invoice.depositRequired > 0 &&
                  invoice.depositRequired < invoice.balanceDue && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(invoice.depositRequired)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      Deposit ({formatCurrency(invoice.depositRequired)})
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => setCustomPayAmount(invoice.balanceDue)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                >
                  Full Balance
                </button>
              </div>
            </div>

            {/* Tab 1: Card / Online Paystack */}
            {activeTab === "card" && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Fast and automated. Pay with your Debit Card, USSD code, or Paystack Bank Transfer. Your balance updates instantly.
                </p>
                <button
                  type="button"
                  onClick={handlePayOnline}
                  disabled={initPayment.isPending}
                  className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {initPayment.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Pay {formatCurrency(Number(customPayAmount) || invoice.balanceDue)} Online
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 2: Direct Bank Transfer */}
            {activeTab === "transfer" && (
              <div className="space-y-4">
                {vendor?.payoutAccount?.accountNumber ? (
                  <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Bank Name</span>
                      <span className="text-xs font-bold text-gray-900">
                        {vendor.payoutAccount.bankName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-brand-700 tracking-wider">
                          {vendor.payoutAccount.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyAccount(vendor.payoutAccount!.accountNumber)
                          }
                          className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Account Name</span>
                      <span className="text-xs font-bold text-gray-900">
                        {vendor.payoutAccount.accountName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    The vendor has not connected a bank account yet. Please contact them directly via WhatsApp or phone.
                  </div>
                )}

                <p className="text-xs text-gray-500 leading-relaxed">
                  After transferring from your banking app, tap the button below to notify the vendor so they can confirm and credit your invoice.
                </p>

                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>I Have Made This Transfer</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Terms & Notes */}
        {(invoice.notes || invoice.terms) && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/70 space-y-3 text-xs text-gray-500">
            {invoice.notes && (
              <div>
                <span className="font-bold text-gray-700 block mb-1">Notes:</span>
                <p className="leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-700 block mb-1">Terms:</span>
                <p className="leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Powered by Vendra Footer */}
        <div className="text-center py-4 text-xs text-gray-400">
          Powered by <span className="font-bold text-brand-600">Vendra</span> — Live Commerce & Order Management
        </div>
      </div>

      {/* Manual Transfer Proof Submission Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Submit Bank Transfer Proof
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Let {vendor?.businessName} know you have sent funds so they can verify your payment.
            </p>

            <form onSubmit={handleProofSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Transferred (₦)
                </label>
                <input
                  type="number"
                  value={customPayAmount}
                  onChange={(e) =>
                    setCustomPayAmount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sender Account Name *
                </label>
                <input
                  type="text"
                  value={transferSender}
                  onChange={(e) => setTransferSender(e.target.value)}
                  placeholder="e.g. Adekunle Ibrahim"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Session ID / Bank Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. 100004289874839201"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Paid from Kuda app"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitProof.isPending}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitProof.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Proof</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
