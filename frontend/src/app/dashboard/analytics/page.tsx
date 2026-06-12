"use client";

import { useState } from "react";
import { BarChart3, Boxes, TrendingUp, Users } from "lucide-react";
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
import {
  useAnalyticsOverview,
  useRevenueSeries,
  useSlowMovers,
  useTopCustomers,
  useTopProducts,
} from "@/hooks/useAnalytics";
import { formatCurrency, formatDate } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const overview = useAnalyticsOverview();
  const revenue = useRevenueSeries(period);
  const topProducts = useTopProducts();
  const slowMovers = useSlowMovers();
  const topCustomers = useTopCustomers();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Understand revenue, best sellers, slow-moving inventory and high-value customers."
        action={
          <NativeSelect
            className="w-40"
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </NativeSelect>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Month revenue"
          value={formatCurrency(overview.data?.revenueThisMonth ?? 0)}
          helper={`${overview.data?.ordersThisMonth ?? 0} completed orders`}
          icon={TrendingUp}
        />
        <StatCard
          label="Open debt"
          value={formatCurrency(overview.data?.totalDebt ?? 0)}
          helper={`${overview.data?.debtOrderCount ?? 0} orders`}
          icon={BarChart3}
          tone="amber"
        />
        <StatCard
          label="Low stock"
          value={String(overview.data?.lowStockCount ?? 0)}
          icon={Boxes}
          tone="rose"
        />
        <StatCard
          label="Top customers shown"
          value={String(topCustomers.data?.length ?? 0)}
          icon={Users}
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-gray-950">Revenue</h2>
          <p className="mb-4 text-sm text-gray-500">
            Completed order revenue by selected period.
          </p>
          <RevenueChart data={revenue.data ?? []} />
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-gray-950">
            Top products
          </h2>
          <p className="mb-4 text-sm text-gray-500">Best sellers by revenue.</p>
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
                    width={90}
                    tick={{ fontSize: 12 }}
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
            <p className="text-sm text-gray-500">
              Complete orders to populate best sellers.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-950">
            Top customers
          </h2>
          {topCustomers.data?.length ? (
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">LTV</th>
                    <th className="px-4 py-3">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topCustomers.data.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-4 py-3 font-medium text-gray-950">
                        {customer.name}
                      </td>
                      <td className="px-4 py-3">{customer.orderCount}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(customer.ltv)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {customer.lastOrderDate
                          ? formatDate(customer.lastOrderDate)
                          : "No completed orders"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <EmptyState
              title="No customer analytics yet"
              description="Mark orders as completed to update customer LTV."
            />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-950">
            Slow movers
          </h2>
          {slowMovers.data?.length ? (
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Base price</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slowMovers.data.map((product) => (
                    <tr key={product._id}>
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
              description="Your active products have recent sales or no active inventory is available."
            />
          )}
        </section>
      </div>
    </div>
  );
}
