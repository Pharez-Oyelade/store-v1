"use client";

import React, { useState } from "react";
import { Sparkles, X, Tag } from "lucide-react";
import { hasMinPlan } from "@/lib/subscriptionGating";

interface AnnouncementBarProps {
  subscriptionPlan?: string;
  announcementText?: string;
  announcementActive?: boolean;
  activeCampaign?: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    minOrderAmount?: number;
  } | null;
  themeColor?: string;
}

export function AnnouncementBar({
  subscriptionPlan,
  announcementText,
  announcementActive = true,
  activeCampaign,
  themeColor = "#C88A2C",
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only displayed for Drape plan and upward (Drape, Atelier, Maison)
  const isAllowedTier = hasMinPlan(subscriptionPlan, "drape");
  if (!isAllowedTier || dismissed) return null;

  // Determine what message to show
  let message = "";
  let isPromo = false;

  if (activeCampaign && activeCampaign.code) {
    isPromo = true;
    const discountStr =
      activeCampaign.type === "percentage"
        ? `${activeCampaign.value}% OFF`
        : `₦${activeCampaign.value.toLocaleString("en-NG")} OFF`;
    message = `Special Offer: Use code "${activeCampaign.code}" for ${discountStr} at checkout!`;
  } else if (announcementActive && announcementText && announcementText.trim()) {
    message = announcementText.trim();
  }

  if (!message) return null;

  return (
    <aside
      aria-label="Store announcement"
      className="relative z-50 text-white text-xs sm:text-[13px] font-medium py-2.5 px-4 text-center transition-all duration-300 shadow-xs"
      style={{
        backgroundColor: themeColor || "#1F2937",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 pr-6 sm:pr-0">
        {isPromo ? (
          <Tag className="size-3.5 shrink-0 text-amber-300 animate-pulse" />
        ) : (
          <Sparkles className="size-3.5 shrink-0 text-amber-300" />
        )}
        <span className="tracking-wide">{message}</span>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="size-3.5" />
      </button>
    </aside>
  );
}
