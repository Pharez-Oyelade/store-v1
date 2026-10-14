"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  ExternalLink,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import type { Invoice } from "@/types";
import { formatCurrency, buildWhatsAppLink } from "@/lib/utils";
import toast from "react-hot-toast";

interface InvoiceShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  liveUrl: string;
}

export function InvoiceShareModal({
  isOpen,
  onClose,
  invoice,
  liveUrl,
}: InvoiceShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      setCanNativeShare(true);
    }
  }, []);

  // Keyboard Escape listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const custName = invoice.customerSnapshot?.name || "Valued Customer";
  const customerPhone = invoice.customerSnapshot?.phone || "";
  const customerEmail = invoice.customerSnapshot?.email || "";

  // Dynamic message based on invoice status
  let message = "";
  let subject = `Invoice #${invoice.invoiceNumber}`;
  if (invoice.status === "paid") {
    subject = `Payment Receipt for Invoice #${invoice.invoiceNumber}`;
    message = `Hi ${custName}, thank you for your payment! Your invoice #${invoice.invoiceNumber} is fully settled.\n\nTotal Paid: ${formatCurrency(
      invoice.totalPaid,
    )}\nBalance Remaining: ₦0\n\nYou can access your official receipt here anytime:\n${liveUrl}`;
  } else if (invoice.status === "partially_paid") {
    subject = `Payment Received - Invoice #${invoice.invoiceNumber}`;
    message = `Hi ${custName}, thank you for your payment! We have received ${formatCurrency(
      invoice.totalPaid,
    )} for invoice #${invoice.invoiceNumber}.\n\nOutstanding Balance: ${formatCurrency(
      invoice.balanceDue,
    )}\n\nYou can view your updated invoice and complete payment here:\n${liveUrl}`;
  } else {
    subject = `Your Invoice #${invoice.invoiceNumber}`;
    message = `Hi ${custName}, here is your live invoice #${invoice.invoiceNumber}.\n\nTotal: ${formatCurrency(
      invoice.totalAmount,
    )}\nBalance Due: ${formatCurrency(invoice.balanceDue)}\n\nView invoice, pay online, or see transfer details here:\n${liveUrl}`;
  }

  // 1. WhatsApp Action
  const handleWhatsApp = () => {
    if (customerPhone) {
      window.open(buildWhatsAppLink(customerPhone, message), "_blank");
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  };

  // 2. Instagram Action (Auto-copies message and opens Instagram DMs)
  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message & invoice link copied! Opening Instagram DMs...", {
        duration: 3500,
        icon: "📋",
      });
      window.open("https://instagram.com/direct/inbox/", "_blank");
    } catch {
      toast.error("Failed to copy message. Please copy manually.");
    }
  };

  // 3. X (Twitter) Action
  const handleX = () => {
    const tweetText = `Hi ${custName}, here is your invoice #${invoice.invoiceNumber}:\n${liveUrl}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank",
    );
  };

  // 4. Email Action
  const handleEmail = () => {
    const mailto = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
  };

  // 5. Native OS Share Action
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: subject,
        text: message,
        url: liveUrl,
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Could not complete share");
      }
    }
  };

  // 6. Copy Full Formatted Message
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      toast.success("Full message copied to clipboard!");
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  // 7. Copy Link Only
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedLink(true);
      toast.success("Live customer link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {invoice.status === "paid"
                  ? "Share Payment Receipt"
                  : invoice.status === "partially_paid"
                    ? "Share Payment Update"
                    : "Share Live Invoice"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Share invoice #{invoice.invoiceNumber} with {custName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Channels Grid */}
        <div className="py-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
            Share to customer channel
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>WhatsApp</title>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-950">WhatsApp</p>
                <p className="text-[11px] text-emerald-700 truncate">
                  {customerPhone
                    ? `Send to ${customerPhone}`
                    : "Open WhatsApp chat"}
                </p>
              </div>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleInstagram}
              className="flex items-center gap-3 p-3 rounded-2xl border border-pink-200/80 bg-pink-50/40 hover:bg-pink-100/60 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {/* <InstagramIcon className="w-4.5 h-4.5 fill-current" /> */}
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Instagram</title>
                  <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">Instagram</p>
                <p className="text-[11px] text-gray-500 truncate">
                  Copy & open Instagram DMs
                </p>
              </div>
            </button>

            {/* X (Twitter) */}
            {/* <button
              type="button"
              onClick={handleX}
              className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                >
                  <title>X</title>
                  <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">X (Twitter)</p>
                <p className="text-[11px] text-gray-500 truncate">
                  Share post or send in DM
                </p>
              </div>
            </button> */}

            {/* Email */}
            <button
              type="button"
              onClick={handleEmail}
              className="flex items-center gap-3 p-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-100/60 transition-all text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-950">Email</p>
                <p className="text-[11px] text-blue-700 truncate">
                  {customerEmail ? customerEmail : "Open default mail client"}
                </p>
              </div>
            </button>
          </div>

          {/* Native System Share (Mobile / Supported Browsers) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer mt-1"
            >
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span>More Options (X, Telegram, Slack)</span>
            </button>
          )}
        </div>

        {/* Message Preview Box */}
        <div className="mt-2 rounded-2xl border border-gray-200/90 bg-gray-50/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              Message Preview
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-line font-mono bg-white p-2.5 rounded-xl border border-gray-200/70 select-all max-h-36 overflow-y-auto text-[11px] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Quick Link Copy Bar & Footer Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="flex-1 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs font-medium transition-colors cursor-pointer"
            title="Open customer view in new tab"
          >
            <span>Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Brand SVG Icons ────────────────────────────────────────────── */

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function XPlatformIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
