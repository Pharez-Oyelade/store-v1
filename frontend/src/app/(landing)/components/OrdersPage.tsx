"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  EmptyState,
  NativeSelect,
  PageHeader,
  StatusBadge,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import { useDeleteOrder, useOrders, useUpdateOrder } from "@/hooks/useOrders";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatus, type Order } from "@/types";

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as OrderStatus | null;
  const orders = useOrders({
    page: 1,
    limit: 50,
    status: initialStatus ?? undefined,
  });
  const deleteOrder = useDeleteOrder();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Orders"
        description="Track deposits, balances, production status and WhatsApp confirmations."
        action={
          <Link
            href="/dashboard/orders/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <Plus className="size-4 text-white" />
            <span className="text-white">New order</span>
          </Link>
        }
      />

      {orders.data?.orders.length ? (
        <TableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.data.orders.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onDelete={() => {
                    if (
                      confirm(
                        `Delete order for ${order.customerSnapshot.name}?`,
                      )
                    )
                      deleteOrder.mutate(order._id);
                  }}
                />
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : (
        <EmptyState
          title="No orders found"
          description="Create a manual order and Vendra will create or update the customer record automatically."
          href="/dashboard/orders/new"
          actionLabel="Create order"
        />
      )}
    </div>
  );
}

function OrderRow({ order, onDelete }: { order: Order; onDelete: () => void }) {
  const updateOrder = useUpdateOrder(order._id);
  const message = buildOrderMessage(order);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/orders/${order._id}`}
          className="font-medium text-gray-950"
        >
          {order.customerSnapshot.name}
        </Link>
        <p className="text-xs text-gray-500">{order.customerSnapshot.phone}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">{order.items.length} items</td>
      <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
      <td className="px-4 py-3">{formatCurrency(order.balanceOwed)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge value={order.status} />
          <NativeSelect
            className="h-8 w-32"
            value={order.status}
            onChange={(event) =>
              updateOrder.mutate({ status: event.target.value as OrderStatus })
            }
          >
            {Object.values(OrderStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <a
            href={buildWhatsAppLink(order.customerSnapshot.phone, message)}
            target="_blank"
            rel="noreferrer"
            onClick={() => updateOrder.mutate({ whatsappSent: true })}
            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-50"
            aria-label="Send WhatsApp confirmation"
          >
            <MessageCircle className="size-4" />
          </a>
          <button
            onClick={onDelete}
            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
            aria-label="Delete order"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function buildOrderMessage(order: Order) {
  const lines = order.items
    .map(
      (item) =>
        `${item.productName} (${item.variantLabel}) x ${item.quantity} - ${formatCurrency(item.price * item.quantity)}`,
    )
    .join("\n");
  return [
    `Hi ${order.customerSnapshot.name}, your Vendra order is recorded.`,
    "",
    lines,
    "",
    `Total: ${formatCurrency(order.totalAmount)}`,
    `Deposit: ${formatCurrency(order.depositPaid)}`,
    `Balance: ${formatCurrency(order.balanceOwed)}`,
  ].join("\n");
}
