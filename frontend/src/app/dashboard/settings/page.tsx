"use client";

import { BadgeCheck, CreditCard, Shield } from "lucide-react";
import VendorProfileForm from "@/components/dashboard/VendorProfileForm";
import {
  PageHeader,
  StatCard,
} from "@/components/dashboard/DashboardPrimitives";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { BillingPanel } from "@/components/dashboard/BillingPanel";

export default function SettingsPage() {
  const profile = useVendorProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Manage your business identity, contact details and subscription state."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Plan"
          value={profile.data?.subscriptionPlan ?? "free"}
          helper={profile.data?.subscriptionStatus ?? "active"}
          icon={CreditCard}
        />
        <StatCard
          label="Role"
          value={profile.data?.role ?? "vendor"}
          icon={Shield}
          tone="blue"
        />
        <StatCard
          label="Account"
          value={profile.data?.isActive ? "Active" : "Inactive"}
          icon={BadgeCheck}
          tone={profile.data?.isActive ? "green" : "rose"}
        />
      </div>

      <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-brand-900/50 dark:bg-brand-900/10 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-900 dark:text-brand-100 mb-1">
            WhatsApp Templates
          </h2>
          <p className="text-sm text-brand-700 dark:text-brand-300">
            Customize your automated social messaging templates.
          </p>
        </div>
        <a
          href="/dashboard/settings/templates"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-6 md:py-2 text-sm font-medium text-white shadow transition-colors hover:bg-brand-700"
        >
          <span className="text-white text-center">Edit Templates</span>
        </a>
      </div>

      <VendorProfileForm />

      <BillingPanel />
    </div>
  );
}
