"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { hasMinPlan, getPlanDisplayName } from "@/lib/subscriptionGating";

interface PlanGateProps {
  requiredPlan: "stitch" | "drape" | "atelier" | "maison";
  featureName: string;
  description?: string;
  children: React.ReactNode;
  fallbackMode?: "card" | "banner" | "blur";
}

export default function PlanGate({
  requiredPlan,
  featureName,
  description,
  children,
  fallbackMode = "card",
}: PlanGateProps) {
  const vendor = useAuthStore((s) => s.vendor);
  const currentPlan =
    vendor?.subscriptionPlan || vendor?.subscription?.plan || "free";
  const userRole = vendor?.user?.role || vendor?.role;

  // Platform admins bypass plan restrictions
  if (userRole === "admin" || vendor?.role === "admin") {
    return <>{children}</>;
  }

  const isAllowed = hasMinPlan(currentPlan, requiredPlan);

  if (isAllowed) {
    return <>{children}</>;
  }

  const requiredPlanName = getPlanDisplayName(requiredPlan);

  if (fallbackMode === "banner") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-950">
              {featureName} requires {requiredPlanName}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {description ||
                `Upgrade your account to unlock ${featureName.toLowerCase()}.`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings?tab=billing"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shrink-0 transition-colors"
        >
          <span className="text-white">Upgrade to {requiredPlanName}</span>
          <ArrowRight size={14} className="text-white" />
        </Link>
      </div>
    );
  }

  if (fallbackMode === "blur") {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none filter blur-md select-none opacity-40">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-white/60 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                {requiredPlanName} Feature
              </div>
              <h3 className="text-lg font-bold text-gray-900">{featureName}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {description ||
                  `Unlock deep metrics, automated calculations, and growth insights with ${requiredPlanName}.`}
              </p>
            </div>
            <Link
              href="/dashboard/settings?tab=billing"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <span className="text-white">Upgrade to {requiredPlanName}</span>
              <ArrowRight size={14} className="text-white" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default "card" mode
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm my-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-xs">
        <Lock size={28} />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} />
          {requiredPlanName} Plan Required
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          Unlock {featureName}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed pt-1">
          {description ||
            `This feature is available exclusively to vendors on ${requiredPlanName} and above. Upgrade your subscription to gain instant access.`}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/dashboard/settings?tab=billing"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors"
        >
          <span className="text-white">Upgrade to {requiredPlanName}</span>
          <ArrowRight size={16} className="text-white" />
        </Link>
      </div>
    </div>
  );
}
