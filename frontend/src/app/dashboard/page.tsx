"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  CalendarDays,
  PackageCheck,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { useAnalyticsOverview, useRevenueSeries, useTopCustomers } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierSummary } from "@/hooks/useSuppliers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const overview = useAnalyticsOverview();
  const revenue = useRevenueSeries("daily");
  const orders = useOrders({ page: 1, limit: 5 });
  const products = useProducts({ page: 1, limit: 50 });
  const topCustomers = useTopCustomers();
  const suppliers = useSupplierSummary();

  const productList = products.data?.products ?? [];
  const lowStockProducts = productList.filter((product) =>
    product.variants.some((variant) => variant.quantity <= product.lowStockThreshold),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="Your inventory, orders, customers and supplier activity in one place."
        action={
          <div className="flex gap-2">
            <Link
              href="/dashboard/orders/new"
              className="inline-flex h-9 items-center rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
            >
              New order
            </Link>
            <Link
              href="/dashboard/products/new"
              className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add product
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={formatCurrency(overview.data?.revenueToday ?? 0)}
          helper={`${overview.data?.ordersToday ?? 0} completed orders`}
          icon={Banknote}
        />
        <StatCard
          label="This week"
          value={formatCurrency(overview.data?.revenueThisWeek ?? 0)}
          helper={`${overview.data?.ordersThisWeek ?? 0} completed orders`}
          icon={CalendarDays}
          tone="blue"
        />
        <StatCard
          label="This month"
          value={formatCurrency(overview.data?.revenueThisMonth ?? 0)}
          helper={`${overview.data?.ordersThisMonth ?? 0} completed orders`}
          icon={Receipt}
          tone="slate"
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(overview.data?.totalDebt ?? 0)}
          helper={`${overview.data?.debtOrderCount ?? 0} open orders`}
          icon={AlertTriangle}
          tone={(overview.data?.totalDebt ?? 0) > 0 ? "amber" : "green"}
        />
      </div>

      {(overview.data?.totalDebt ?? 0) > 0 && (
        <Link
          href="/dashboard/orders?status=pending"
          className="mt-4 flex flex-col gap-1 rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {formatCurrency(overview.data?.totalDebt ?? 0)} outstanding across{" "}
            {overview.data?.debtOrderCount ?? 0} orders.
          </span>
          <span className="font-medium">Review balances</span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Revenue trend</h2>
              <p className="text-sm text-gray-500">Completed order revenue over the last 14 days.</p>
            </div>
            <Link href="/dashboard/analytics" className="text-sm font-medium text-brand-700">
              Analytics
            </Link>
          </div>
          <RevenueChart data={revenue.data ?? []} />
        </section>

        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-950">Operations</h2>
            <Boxes className="size-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            <MiniMetric
              label="Products tracked"
              value={products.data?.pagination.total ?? 0}
              icon={PackageCheck}
            />
            <MiniMetric
              label="Low-stock products"
              value={overview.data?.lowStockCount ?? lowStockProducts.length}
              icon={AlertTriangle}
            />
            <MiniMetric
              label="Customers"
              value={topCustomers.data?.length ?? 0}
              icon={Users}
            />
            <MiniMetric
              label="Suppliers"
              value={suppliers.data?.total ?? 0}
              icon={ShoppingCart}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-950">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-brand-700">
              View all
            </Link>
          </div>
          {orders.data?.orders.length ? (
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.data.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/orders/${order._id}`} className="font-medium text-gray-950">
                          {order.customerSnapshot.name}
                        </Link>
                        <p className="text-xs text-gray-500">{order.customerSnapshot.phone}</p>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(order.balanceOwed)}</td>
                      <td className="px-4 py-3"><StatusBadge value={order.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <EmptyState
              title="No orders yet"
              description="Create your first order from Instagram, WhatsApp, a call, or a walk-in sale."
              href="/dashboard/orders/new"
              actionLabel="Create order"
            />
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-950">Low stock</h2>
            <Link href="/dashboard/products" className="text-sm font-medium text-brand-700">
              Inventory
            </Link>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            {lowStockProducts.length ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-950">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category || "Uncategorized"}</p>
                    </div>
                    <StatusBadge value={product.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No low-stock alerts from your active inventory.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Boxes;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-gray-500" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-950">{value}</span>
    </div>
  );
}
