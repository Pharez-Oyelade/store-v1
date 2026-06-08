"use client";

import { BadgeCheck, CreditCard, Shield } from "lucide-react";
import VendorProfileForm from "@/components/dashboard/VendorProfileForm";
import { PageHeader, StatCard } from "@/components/dashboard/DashboardPrimitives";
import { useVendorProfile } from "@/hooks/useVendorProfile";

export default function SettingsPage() {
  const profile = useVendorProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Manage your business identity, contact details and subscription state."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Plan" value={profile.data?.subscriptionPlan ?? "free"} helper={profile.data?.subscriptionStatus ?? "active"} icon={CreditCard} />
        <StatCard label="Role" value={profile.data?.role ?? "vendor"} icon={Shield} tone="blue" />
        <StatCard label="Account" value={profile.data?.isActive ? "Active" : "Inactive"} icon={BadgeCheck} tone={profile.data?.isActive ? "green" : "rose"} />
      </div>

      <VendorProfileForm />
    </div>
  );
}
