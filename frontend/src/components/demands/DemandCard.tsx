"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Phone,
  MessageCircle,
  Clock,
  AlertCircle,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import type { CustomRequest } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DemandCardProps {
  request: CustomRequest;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  inquiry: {
    label: "Inquiry",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  quoted: {
    label: "Quoted",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  sourcing: {
    label: "Sourcing Fabric",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  in_progress: {
    label: "In Progress / Sewing",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  fitting: {
    label: "Fitting Ready",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export default function DemandCard({ request }: DemandCardProps) {
  const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.inquiry;
  const targetPrice =
    request.agreedPrice > 0 ? request.agreedPrice : request.estimatedPrice;

  // Deadline calculation
  let deadlineInfo: { text: string; isOverdue: boolean } | null = null;
  if (request.deadline) {
    const deadlineDate = new Date(request.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (request.status === "completed") {
      deadlineInfo = { text: "Delivered", isOverdue: false };
    } else if (diffDays < 0) {
      deadlineInfo = {
        text: `Overdue by ${Math.abs(diffDays)}d`,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      deadlineInfo = { text: "Due today!", isOverdue: false };
    } else {
      deadlineInfo = { text: `Due in ${diffDays}d`, isOverdue: false };
    }
  }

  // Pick suitable WhatsApp link based on current status
  let whatsappLink = request.whatsappLinks?.quote;
  if (request.status === "confirmed" || request.status === "in_progress") {
    whatsappLink = request.whatsappLinks?.confirmed;
  } else if (request.status === "fitting") {
    whatsappLink = request.whatsappLinks?.fitting;
  } else if (request.status === "completed") {
    whatsappLink = request.whatsappLinks?.completed;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-brand-700/50 hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wider">
            {request.category}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Title */}
        <Link href={`/dashboard/demands/${request._id}`} className="block">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-1 mb-1">
            {request.title}
          </h3>
        </Link>

        {/* Customer snapshot */}
        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-4">
          <span className="text-gray-900 font-semibold">
            {request.customerSnapshot.name}
          </span>
          &middot; {request.customerSnapshot.phone}
        </p>

        {/* Reference Image Thumbnail if available */}
        {request.referenceImages && request.referenceImages.length > 0 && (
          <div className="flex gap-1.5 mb-4 overflow-hidden rounded-xl">
            {request.referenceImages.slice(0, 3).map((img, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0"
              >
                <img
                  src={img.url}
                  alt="Ref"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {request.referenceImages.length > 3 && (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                +{request.referenceImages.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Deadline pill */}
        {deadlineInfo && (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg mb-4 ${
              deadlineInfo.isOverdue
                ? "bg-red-50 text-red-700 font-bold"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {deadlineInfo.isOverdue ? (
              <AlertCircle size={14} />
            ) : (
              <Calendar size={14} />
            )}
            <span>{deadlineInfo.text}</span>
          </div>
        )}
      </div>

      {/* Footer: Pricing & Action buttons */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
        <div>
          <p className="text-xs text-gray-400">Total Value</p>
          <p className="text-sm font-bold text-gray-900">
            {targetPrice > 0 ? formatCurrency(targetPrice) : "Not Quoted"}
          </p>
          {request.balanceOwed > 0 && (
            <p className="text-[11px] font-semibold text-amber-600">
              Bal: {formatCurrency(request.balanceOwed)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Message Customer on WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
          )}
          <Link
            href={`/dashboard/demands/${request._id}`}
            className="px-3.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 !text-white text-xs font-semibold shadow-xs flex items-center justify-center transition-colors"
          >
            Manage
          </Link>

        </div>
      </div>
    </div>
  );
}
