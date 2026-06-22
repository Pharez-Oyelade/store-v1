"use client";

import {
  Users,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Package,
  Clock,
  UserPlus,
  Activity,
} from "lucide-react";
import {
  KpiCard,
  AdminPageHeader,
  AdminCard,
  AdminEmptyState,
  AdminSkeleton,
  formatNaira,
  formatCompact,
} from "@/components/admin/AdminPrimitives";
import { usePlatformKPIs } from "@/hooks/useAdmin";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function AdminOverviewPage() {
  const { data: kpis, isLoading, error } = usePlatformKPIs();

  return (
    <div>
      <AdminPageHeader
        title="Platform Overview"
        description="Real-time health and activity across Vendra"
        action={
          <div className="text-xs text-white/30">Updates every minute</div>
        }
      />

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error || !kpis ? (
        <AdminEmptyState
          title="Failed to load KPIs"
          description="Check your connection and try again"
        />
      ) : (
        <>
          {/* Row 1: Vendor stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Active Vendors"
              value={kpis.vendors.active.toLocaleString()}
              sub={`${kpis.vendors.suspended} suspended`}
              icon={Users}
              tone="indigo"
            />
            <KpiCard
              label="New Sign-ups (Month)"
              value={kpis.signups.thisMonth.toLocaleString()}
              sub={`${kpis.signups.today} today`}
              icon={UserPlus}
              trend={kpis.signups.growthPct}
              trendLabel="vs last month"
              tone="green"
            />
            <KpiCard
              label="Subscription MRR"
              value={formatNaira(kpis.revenue.mrr)}
              icon={CreditCard}
              tone="amber"
            />
            <KpiCard
              label="GMV Processed"
              value={`₦${formatCompact(kpis.orders.gmv)}`}
              sub="total across all vendors"
              icon={TrendingUp}
              tone="indigo"
            />
          </div>

          {/* Row 2: Order stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total Orders"
              value={kpis.orders.total.toLocaleString()}
              icon={ShoppingCart}
              tone="slate"
            />
            <KpiCard
              label="Pending Orders"
              value={kpis.orders.pending.toLocaleString()}
              sub="across all vendors"
              icon={Clock}
              tone={kpis.orders.pending > 100 ? "rose" : "slate"}
            />
            <KpiCard
              label="Avg. Order Value"
              value={formatNaira(kpis.orders.avgOrderValue)}
              icon={Package}
              tone="slate"
            />
            <KpiCard
              label="Fulfillment Rate"
              value={`${kpis.orders.fulfillmentRate}%`}
              sub="completed / total"
              icon={Activity}
              tone={kpis.orders.fulfillmentRate >= 80 ? "green" : "rose"}
            />
          </div>

          {/* Subscription Tier Breakdown */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <AdminCard className="lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-white/70">
                Subscription Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(kpis.revenue.tierBreakdown).map(
                  ([plan, { count, revenue }]) => {
                    const total = kpis.vendors.active || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="capitalize font-medium text-white/60">
                            {plan}
                          </span>
                          <span className="text-white/40">
                            {count} vendors · {formatNaira(revenue)}/mo
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </AdminCard>

            {/* Quick Actions */}
            <AdminCard>
              <h2 className="mb-4 text-sm font-semibold text-white/70">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-2">
                <Link
                  href="/admin/vendors"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400"
                >
                  <Users className="size-4 text-white/70" />
                  <span className="text-white/70">Manage Vendors</span>
                </Link>
                <Link
                  href="/admin/subscriptions"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400"
                >
                  <CreditCard className="size-4 text-white/70" />
                  <span className="text-white/70">View Billing Health</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400"
                >
                  <TrendingUp className="size-4 text-white/70" />
                  <span className="text-white/70">Platform Analytics</span>
                </Link>
                <Link
                  href="/admin/announcements"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400"
                >
                  <Activity className="size-4 text-white/70" />
                  <span className="text-white/70">Publish Announcement</span>
                </Link>
              </div>
            </AdminCard>
          </div>
        </>
      )}
    </div>
  );
}
