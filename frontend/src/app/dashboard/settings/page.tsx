"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  Shield,
  Users,
  User,
  Receipt,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import VendorProfileForm from "@/components/dashboard/VendorProfileForm";
import {
  PageHeader,
  StatCard,
} from "@/components/dashboard/DashboardPrimitives";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import TeamPanel from "@/components/dashboard/TeamPanel";
import { useAuthStore } from "@/store/authStore";
import { Suspense } from "react";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const vendor = useAuthStore((s) => s.vendor);
  const profile = useVendorProfile();

  const userRole = (vendor?.user?.role || vendor?.role || "owner") as string;
  const isOwner = userRole === "owner" || userRole === "admin";
  const isManager = userRole === "manager";
  const isRestrictedRole = userRole === "tailor" || userRole === "sales";

  const [activeTab, setActiveTab] = useState<"profile" | "team" | "billing">(
    tabParam === "team" || tabParam === "billing" ? tabParam : "profile",
  );

  // Sync activeTab whenever URL query params change (e.g. ?tab=billing from TeamPanel buttons)
  useEffect(() => {
    if (
      tabParam === "team" ||
      tabParam === "billing" ||
      tabParam === "profile"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: "profile" | "team" | "billing") => {
    setActiveTab(newTab);
    router.replace(`/dashboard/settings?tab=${newTab}`, { scroll: false });
  };

  // If a tailor or sales rep manually navigates to settings, show friendly restricted screen
  if (isRestrictedRole) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="size-16 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center border border-amber-200">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Settings Access Restricted
        </h2>
        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
          Store settings, team seats, and subscription billing can only be
          managed by the store owner and managers.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white font-bold text-xs hover:bg-brand-800 transition-colors shadow-xs"
          >
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <PageHeader
        title="Settings"
        description="Manage your store profile, team members & staff permissions, and subscription billing."
      />

      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Subscription Plan"
          value={profile.data?.subscriptionPlan ?? "free"}
          helper={profile.data?.subscriptionStatus ?? "active"}
          icon={CreditCard}
        />
        <StatCard
          label="Access Role"
          value={userRole}
          icon={Shield}
          tone="blue"
        />
        <StatCard
          label="Account Status"
          value={profile.data?.isActive ? "Active" : "Inactive"}
          icon={BadgeCheck}
          tone={profile.data?.isActive ? "green" : "rose"}
        />
      </div>

      {/* WhatsApp Templates Banner */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-brand-900 mb-0.5">
            Automated WhatsApp Templates
          </h2>
          <p className="text-xs text-brand-700">
            Customize personalized order confirmations, fitting reminders, and
            delivery messages.
          </p>
        </div>
        <a
          href="/dashboard/settings/templates"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-700 px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-800 shrink-0"
        >
          <div className="flex justify-center items-center gap-2 text-white">
            <span>Edit Templates</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </a>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "profile"
              ? "border-brand-700 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <User size={16} />
          <span>General Profile</span>
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => handleTabChange("team")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "team"
                ? "border-brand-700 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users size={16} />
            <span>Team & Staff Seats</span>
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={() => handleTabChange("billing")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "billing"
                ? "border-brand-700 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Receipt size={16} />
            <span>Billing & Plans</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "profile" && <VendorProfileForm />}
      {isOwner && activeTab === "team" && (
        <TeamPanel onNavigateTab={handleTabChange} />
      )}
      {isOwner && activeTab === "billing" && <BillingPanel />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
