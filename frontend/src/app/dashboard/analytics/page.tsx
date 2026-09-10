"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  TrendingUp,
  Users,
  Download,
  Sparkles,
  Scissors,
  Package,
  Clock,
  UserCheck,
  Percent,
  Wallet,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  NativeSelect,
  PageHeader,
  StatCard,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PlanGate from "@/components/dashboard/PlanGate";
import {
  ANALYTICS_KEYS,
  useAnalyticsOverview,
  useRevenueSeries,
  useSlowMovers,
  useTopCustomers,
  useTopProducts,
  useBespokeVsRtwBreakdown,
  useWorkshopProductivity,
  useMarginEstimator,
  downloadVendorCsv,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { hasMinPlan } from "@/lib/subscriptionGating";
import toast from "react-hot-toast";

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function AnalyticsPage() {
  const vendor = useAuthStore((s) => s.vendor);
  const currentPlan =
    vendor?.subscriptionPlan || vendor?.subscription?.plan || "free";
  const isAdmin =
    (vendor?.user?.role as string) === "admin" ||
    (vendor?.role as string) === "admin";

  const isFree = currentPlan === "free" && !isAdmin;
  const isStitch = currentPlan === "stitch" && !isAdmin;
  const isDrape = currentPlan === "drape" && !isAdmin;
  const isAtelierOrHigher = hasMinPlan(currentPlan, "atelier") || isAdmin;

  // Stitch is forced to daily 7-day snapshot; Drape and Atelier have full period selection
  const [period, setPeriod] = useState<Period>("daily");
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.all });
      toast.success("Analytics refreshed");
    } catch {
      toast.error("Failed to refresh metrics");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Queries (enabled based on plan tier)
  const overview = useAnalyticsOverview({ enabled: !isFree });
  const revenue = useRevenueSeries(isStitch ? "daily" : period, {
    enabled: !isFree,
  });
  const topProducts = useTopProducts({ enabled: !isFree });
  const slowMovers = useSlowMovers({
    enabled: hasMinPlan(currentPlan, "drape") || isAdmin,
  });
  const topCustomers = useTopCustomers({
    enabled: hasMinPlan(currentPlan, "drape") || isAdmin,
  });
  const bespokeRtw = useBespokeVsRtwBreakdown({ enabled: isAtelierOrHigher });
  const workshop = useWorkshopProductivity({ enabled: isAtelierOrHigher });
  const margins = useMarginEstimator({ enabled: isAtelierOrHigher });

  const handleExport = async (
    type: "orders" | "customers" | "inventory" | "financials",
  ) => {
    setExportingType(type);
    try {
      await downloadVendorCsv(type, vendor?.handle || "vendra");
      toast.success(`${type.toUpperCase()} report downloaded successfully`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || `Failed to export ${type} data`,
      );
    } finally {
      setExportingType(null);
    }
  };

  // ── 1. Free Tier Paywall Gate ─────────────────────────────────
  if (isFree) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Analytics"
          description="Understand revenue, best sellers, slow-moving inventory and high-value customers."
        />
        <PlanGate
          requiredPlan="stitch"
          featureName="Store Analytics & Growth Metrics"
          description="Gain real-time visibility into your sales velocity, best sellers, customer lifetime value, and bespoke tailoring earnings. Available on The Stitch, The Drape, and The Atelier."
          fallbackMode="card"
        >
          <div />
        </PlanGate>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-16 space-y-8">
      {/* Page Header with Period Switcher & CSV Export */}
      <PageHeader
        title={
          isAtelierOrHigher ? "Atelier Analytics Command Center" : "Analytics"
        }
        description={
          isStitch
            ? "7-Day Sales Snapshot for solo makers. Upgrade to The Drape for full monthly & yearly history."
            : "Understand revenue trends, best sellers, customer lifetime value, and inventory movement."
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync / Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh all metrics"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={isRefreshing ? "animate-spin text-brand-700" : "text-gray-500"}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            {/* Period Switcher */}
            {isStitch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-xs font-semibold">
                <Clock size={14} />
                Last 7 Days (Stitch)
              </span>
            ) : (
              <NativeSelect
                className="w-36 text-xs h-9"
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
              >
                <option value="daily">Daily (14d)</option>
                <option value="weekly">Weekly (8w)</option>
                <option value="monthly">Monthly (6m)</option>
                <option value="yearly">Yearly (12m)</option>
              </NativeSelect>
            )}

            {/* CSV Export Action */}
            {isDrape && (
              <button
                type="button"
                onClick={() => handleExport("orders")}
                disabled={!!exportingType}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                <span>
                  {exportingType === "orders"
                    ? "Exporting..."
                    : "Export Orders CSV"}
                </span>
              </button>
            )}

            {isAtelierOrHigher && (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExport("orders")}
                  disabled={!!exportingType}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>Orders</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("financials")}
                  disabled={!!exportingType}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  <span>Financials</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("customers")}
                  disabled={!!exportingType}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Users size={14} />
                  <span>Customers</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("inventory")}
                  disabled={!!exportingType}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Package size={14} />
                  <span>Stock</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Stitch Tier Upgrade Banner */}
      {isStitch && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-950">
                You are viewing The Stitch 7-Day Snapshot
              </p>
              <p className="text-xs text-blue-800 mt-0.5">
                Upgrade to The Drape to unlock 12-month revenue history,
                customer lifetime value rankings, slow movers, and CSV order
                exports.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <span className="text-white">Upgrade to The Drape</span>
            <ArrowRight size={14} className="text-white" />
          </Link>
        </div>
      )}

      {/* Drape Tier Upsell to Atelier */}
      {isDrape && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-950">
                Unlock The Atelier Full Analytics Command Center
              </p>
              <p className="text-xs text-purple-800 mt-0.5">
                Track tailor turnaround productivity, bespoke vs. ready-to-wear
                revenue splits, and gross operating margins.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-900 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <span className="text-white">Upgrade to The Atelier</span>
            <ArrowRight size={14} className="text-white" />
          </Link>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isStitch ? "7-Day revenue" : "Month revenue"}
          value={formatCurrency(overview.data?.revenueThisMonth ?? 0)}
          helper={`${overview.data?.ordersThisMonth ?? 0} completed orders`}
          icon={TrendingUp}
        />
        <StatCard
          label="Open customer debt"
          value={formatCurrency(overview.data?.totalDebt ?? 0)}
          helper={`${overview.data?.debtOrderCount ?? 0} pending orders`}
          icon={BarChart3}
          tone="amber"
        />
        <StatCard
          label="Low stock items"
          value={String(overview.data?.lowStockCount ?? 0)}
          icon={Boxes}
          tone="rose"
        />
        <StatCard
          label={isStitch ? "Bespoke demands" : "Active demands in production"}
          value={String(overview.data?.activeDemandsCount ?? 0)}
          helper={`${overview.data?.overdueDemandsCount ?? 0} overdue`}
          icon={Scissors}
          tone="blue"
        />
      </div>

      {/* ── ATELIER FULL BI COMMAND CENTER (Atelier Exclusive) ──────── */}
      {isAtelierOrHigher && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-100 text-brand-800">
                <Sparkles size={16} />
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Atelier Workshop Intelligence & Margins
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              The Atelier Plan
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* 1. Bespoke vs Ready-to-Wear Breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Scissors size={18} className="text-brand-700" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Bespoke vs RTW Split
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400">All-time</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>
                        Bespoke Tailoring (
                        {bespokeRtw.data?.bespoke.percent ?? 0}%)
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(bespokeRtw.data?.bespoke.revenue ?? 0)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
                      <div
                        className="bg-brand-700 h-full transition-all"
                        style={{
                          width: `${bespokeRtw.data?.bespoke.percent ?? 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {bespokeRtw.data?.bespoke.count ?? 0} demands · AOV:{" "}
                      {formatCurrency(bespokeRtw.data?.bespoke.aov ?? 0)}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>
                        Ready-to-Wear RTW ({bespokeRtw.data?.rtw.percent ?? 0}%)
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(bespokeRtw.data?.rtw.revenue ?? 0)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
                      <div
                        className="bg-emerald-600 h-full transition-all"
                        style={{
                          width: `${bespokeRtw.data?.rtw.percent ?? 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {bespokeRtw.data?.rtw.count ?? 0} orders · AOV:{" "}
                      {formatCurrency(bespokeRtw.data?.rtw.aov ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Total Channel Volume</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(bespokeRtw.data?.combinedTotal ?? 0)}
                </span>
              </div>
            </div>

            {/* 2. Unit Economics & Profit Margin Estimator */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Percent size={18} className="text-emerald-700" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Unit Economics & Margins
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400">Estimated</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-500">
                      Gross Margin
                    </p>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      {margins.data?.profitMarginPercent ?? 0}%
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Revenue - Material cost
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-500">
                      Average Order (AOV)
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {formatCurrency(margins.data?.aov ?? 0)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Across all channels
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-500">
                      Supplier Purchases
                    </p>
                    <p className="text-sm font-bold text-rose-700 mt-0.5">
                      {formatCurrency(margins.data?.supplierExpenses ?? 0)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Fabric & trims spend
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-500">
                      Repeat Buyer Rate
                    </p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">
                      {margins.data?.repeatRatePercent ?? 0}%
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {margins.data?.repeatCustomers ?? 0} repeat clients
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Est. Gross Profit</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(margins.data?.estimatedGrossProfit ?? 0)}
                </span>
              </div>
            </div>

            {/* 3. Workshop & Tailor Productivity */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-purple-700" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Tailor Turnaround Times
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400">
                    {workshop.data?.summary.totalTailors ?? 0} tailors
                  </span>
                </div>

                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workshop.data?.tailorStats.length ? (
                    workshop.data.tailorStats.map((t) => (
                      <div
                        key={t.tailorId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {t.activeCount} active · {t.completedCount} finished
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-purple-700">
                            ~{t.avgTurnaroundDays} days
                          </span>
                          <p className="text-[10px] text-gray-400">
                            turnaround
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 py-4 text-center">
                      Assign bespoke demands to tailors to track workshop
                      turnaround.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Avg Workshop Delivery</span>
                <span className="font-bold text-purple-800">
                  {workshop.data?.summary.avgOverallTurnaroundDays ?? 0} days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart & Top Products */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Revenue Trend
              </h2>
              <p className="text-xs text-gray-500">
                {isStitch
                  ? "7-day daily completed order revenue."
                  : `Completed order revenue by ${period} period.`}
              </p>
            </div>
          </div>
          <RevenueChart data={revenue.data ?? []} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Top Selling Styles {isStitch && "(Top 3)"}
              </h2>
              <p className="text-xs text-gray-500">
                Best performers by total revenue.
              </p>
            </div>
          </div>

          {topProducts.data?.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.data}
                  layout="vertical"
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `₦${Number(value) / 1000}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#1816a3"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-12 text-center">
              Complete orders to populate best sellers.
            </p>
          )}
        </section>
      </div>

      {/* ── Lower Section: Top Customers & Slow Movers ──────────────── */}
      {isStitch ? (
        <PlanGate
          requiredPlan="drape"
          featureName="Customer Lifetime Value & Slow Movers"
          description="Identify your most valuable customers and discover inventory items with no sales in the last 30 days. Upgrade to The Drape to unlock."
          fallbackMode="card"
        >
          <div />
        </PlanGate>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Top Customers Leaderboard */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-950">
                Top Customers by Lifetime Value
              </h2>
              <span className="text-xs text-gray-400">Ranked by LTV</span>
            </div>

            {topCustomers.data?.length ? (
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Lifetime Value</th>
                      <th className="px-4 py-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topCustomers.data.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-950">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {customer.orderCount}
                        </td>
                        <td className="px-4 py-3 font-bold text-brand-700">
                          {formatCurrency(customer.ltv)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {customer.lastOrderDate
                            ? formatDate(customer.lastOrderDate)
                            : "No orders yet"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <EmptyState
                title="No customer analytics yet"
                description="Mark orders as completed to update customer LTV rankings."
              />
            )}
          </section>

          {/* Slow-Moving Inventory */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-950">
                Slow-Moving Inventory
              </h2>
              <span className="text-xs text-gray-400">
                30+ days without sales
              </span>
            </div>

            {slowMovers.data?.length ? (
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Product / Style</th>
                      <th className="px-4 py-3">Base price</th>
                      <th className="px-4 py-3">Listed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slowMovers.data.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-950">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(product.basePrice)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(product.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <EmptyState
                title="No slow movers"
                description="Your active inventory is moving well with recent sales."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
