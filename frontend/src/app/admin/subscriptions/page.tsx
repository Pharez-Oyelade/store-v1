"use client";

import { CreditCard, Users, TrendingDown } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTableShell,
  PlanBadge,
  AdminSkeleton,
  AdminEmptyState,
  formatNaira,
} from "@/components/admin/AdminPrimitives";
import { useSubscriptionTiers, useBillingHealth } from "@/hooks/useAdmin";
import Link from "next/link";

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  stitch: 4900,
  drape: 14900,
  atelier: 34900,
  maison: 0,
};

export default function AdminSubscriptionsPage() {
  const { data: tiers, isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: health, isLoading: healthLoading } = useBillingHealth();

  return (
    <div>
      <AdminPageHeader
        title="Subscriptions"
        description="Tier configuration and billing health"
      />

      {/* MRR Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminCard>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <CreditCard className="size-4" />
            Monthly Recurring Revenue
          </div>
          {healthLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-white/5" />
          ) : (
            <>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNaira(health?.totalMrr ?? 0)}
              </p>
              <p className="mt-1 text-xs text-white/30">From active paying subscribers</p>
            </>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <TrendingDown className="size-4 text-rose-400" />
            Inactive Subscriptions
          </div>
          {healthLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-white/5" />
          ) : (
            <>
              <p className="mt-2 text-2xl font-semibold text-rose-400">
                {health?.inactiveCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-white/30">Vendors not active in &gt;30 days</p>
            </>
          )}
        </AdminCard>
      </div>

      {/* Tier Breakdown */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Plan config table */}
        <AdminCard>
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Subscription Tiers
          </h2>
          {tiersLoading ? (
            <AdminSkeleton rows={5} />
          ) : (
            <AdminTableShell>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    {["Plan", "Price/mo", "Products", "Orders/mo", "Seats"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-white/30"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {tiers?.map((tier) => (
                    <tr key={tier.plan}>
                      <td className="px-4 py-3">
                        <PlanBadge plan={tier.plan} />
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {tier.price === 0 ? "Free" : formatNaira(tier.price)}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {tier.limits.products === Infinity
                          ? "∞"
                          : tier.limits.products}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {tier.limits.ordersPerMonth === Infinity
                          ? "∞"
                          : tier.limits.ordersPerMonth}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {tier.limits.teamSeats === Infinity
                          ? "∞"
                          : tier.limits.teamSeats}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminCard>

        {/* Per-tier subscriber breakdown */}
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">
              Subscribers by Tier
            </h2>
            <span className="text-xs text-white/30">Active (≤30d) vs Inactive</span>
          </div>
          {healthLoading ? (
            <AdminSkeleton rows={5} />
          ) : health?.tiers ? (
            <div className="space-y-3">
              {Object.entries(health.tiers).map(
                ([plan, { active, inactive, mrr }]) => (
                  <div key={plan}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlanBadge plan={plan} />
                        <span className="text-xs text-white/40">
                          {active + inactive} vendors
                        </span>
                      </div>
                      <span className="text-xs font-medium text-white/60">
                        {formatNaira(mrr)}/mo
                      </span>
                    </div>
                    <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(active / (active + inactive || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-white/10"
                        style={{
                          width: `${(inactive / (active + inactive || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex gap-4 text-[10px] text-white/30">
                      <span className="text-emerald-400/70">{active} active</span>
                      <span>{inactive} inactive</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <AdminEmptyState title="No billing data" />
          )}
        </AdminCard>
      </div>
    </div>
  );
}
