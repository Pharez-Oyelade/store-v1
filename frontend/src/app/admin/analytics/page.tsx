"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AdminPageHeader,
  AdminCard,
  AdminTableShell,
  PlanBadge,
  AdminSkeleton,
  AdminEmptyState,
  formatNaira,
  formatCompact,
  formatMonthYear,
} from "@/components/admin/AdminPrimitives";
import {
  usePlatformRevenue,
  useVendorCohorts,
  useTopPerformers,
  useExportData,
} from "@/hooks/useAdmin";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const METRIC_OPTIONS = [
  { value: "revenue", label: "By Revenue" },
  { value: "orders", label: "By Orders" },
] as const;

/* Custom chart tooltip */
function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D1117] px-3 py-2 text-xs">
      <p className="text-white/50">{label}</p>
      <p className="mt-0.5 font-semibold text-indigo-400">
        {formatNaira(payload[0].value)}
      </p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const exportData = useExportData();

  const { data: revenueSeries, isLoading: revenueLoading } = usePlatformRevenue(period, 6);
  const { data: cohorts, isLoading: cohortsLoading } = useVendorCohorts(6);
  const { data: topPerformers, isLoading: topLoading } = useTopPerformers(metric, 10);

  /* Format revenue series for recharts */
  const chartData = (revenueSeries ?? []).map((point) => {
    let label = "";
    if (point._id.day) {
      label = `${point._id.day} ${formatMonthYear(point._id.year, point._id.month)}`;
    } else if (point._id.month) {
      label = formatMonthYear(point._id.year, point._id.month);
    } else {
      label = `W${point._id.week} ${point._id.year}`;
    }

    return {
      label,
      revenue: point.revenue,
      orders: point.orderCount,
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="Platform Analytics"
        description="Revenue, cohort analysis, and top performers"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => exportData.mutate("vendors")}
              disabled={exportData.isPending}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Download className="size-3.5" />
              Export Vendors
            </button>
            <button
              onClick={() => exportData.mutate("subscriptions")}
              disabled={exportData.isPending}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Download className="size-3.5" />
              Export Subscriptions
            </button>
          </div>
        }
      />

      {/* Revenue Chart */}
      <AdminCard className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70">
            Platform Revenue
          </h2>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  period === value
                    ? "bg-indigo-500 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {revenueLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-white/5" />
        ) : chartData.length === 0 ? (
          <AdminEmptyState title="No revenue data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₦${formatCompact(v)}`}
                width={55}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </AdminCard>

      {/* Cohorts + Top Performers */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Vendor Cohorts */}
        <AdminCard>
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Vendor Cohort Retention
          </h2>
          {cohortsLoading ? (
            <AdminSkeleton rows={6} />
          ) : !cohorts || cohorts.length === 0 ? (
            <AdminEmptyState title="No cohort data" />
          ) : (
            <AdminTableShell>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    {["Month", "Signups", "Active", "Retention", "Paid %"].map(
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
                  {cohorts.map((c) => (
                    <tr key={`${c.year}-${c.month}`}>
                      <td className="px-4 py-3 text-white/70">
                        {formatMonthYear(c.year, c.month)}
                      </td>
                      <td className="px-4 py-3 text-white/50">{c.total}</td>
                      <td className="px-4 py-3 text-white/50">{c.active}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${
                                c.retentionRate >= 70
                                  ? "bg-emerald-500"
                                  : c.retentionRate >= 40
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${c.retentionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/60">
                            {c.retentionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {c.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminCard>

        {/* Top Performers */}
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">
              Top Performers
            </h2>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {METRIC_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setMetric(value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    metric === value
                      ? "bg-indigo-500 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {topLoading ? (
            <AdminSkeleton rows={10} />
          ) : !topPerformers || topPerformers.length === 0 ? (
            <AdminEmptyState title="No vendor data" />
          ) : (
            <ol className="space-y-2">
              {topPerformers.map((p, i) => (
                <li
                  key={p._id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
                >
                  <span className="w-5 shrink-0 text-xs font-bold text-white/20">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/80">
                      {p.vendor.businessName}
                    </p>
                    <p className="text-xs text-white/30">@{p.vendor.handle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-indigo-400">
                      {metric === "revenue"
                        ? formatNaira(p.revenue)
                        : `${p.orderCount} orders`}
                    </p>
                    <PlanBadge plan={p.vendor.subscriptionPlan} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
