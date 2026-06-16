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
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/PaginationControls";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as OrderStatus | null;
  const orders = useOrders({
    page,
    limit: 10,
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
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-4">
            {orders.data.orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onDelete={() => {
                  if (confirm(`Delete order for ${order.customerSnapshot.name}?`))
                    deleteOrder.mutate(order._id);
                }}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
                        if (confirm(`Delete order for ${order.customerSnapshot.name}?`))
                          deleteOrder.mutate(order._id);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
          
          {orders.data?.pagination && (
            <PaginationControls
              currentPage={orders.data.pagination.page}
              totalPages={orders.data.pagination.totalPages}
              hasNextPage={orders.data.pagination.hasNextPage}
              hasPrevPage={orders.data.pagination.hasPrevPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
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

function OrderCard({ order, onDelete }: { order: Order; onDelete: () => void }) {
  const updateOrder = useUpdateOrder(order._id);
  const vendor = useAuthStore((s) => s.vendor);
  const isPremium = vendor?.subscriptionPlan === "atelier" || vendor?.subscriptionPlan === "maison";

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as OrderStatus;
    updateOrder.mutate({ status: newStatus });

    if (isPremium) {
      let link = "";
      if (newStatus === OrderStatus.Confirmed) link = order.whatsappLinks?.confirmed || "";
      else if (newStatus === OrderStatus.Dispatched) link = order.whatsappLinks?.dispatched || "";
      else if (newStatus === OrderStatus.Completed) link = order.whatsappLinks?.completed || "";

      if (link) {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-900">Status changed to {newStatus}. Send update?</p>
            <div className="flex gap-2">
              <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">Skip</button>
              <a href={link} target="_blank" rel="noreferrer" onClick={() => { toast.dismiss(t.id); updateOrder.mutate({ whatsappSent: true }); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#25D366] hover:bg-[#20bd5a] rounded">
                <MessageCircle className="size-3" /> WhatsApp
              </a>
            </div>
          </div>
        ), { duration: 6000, id: `status-toast-mobile-${newStatus}-${order._id}` });
      }
    }
  };

  const message = buildOrderMessage(order);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/dashboard/orders/${order._id}`} className="font-semibold text-gray-900 text-base block hover:underline">
            {order.customerSnapshot.name}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">{order.customerSnapshot.phone} • {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge value={order.status} />
      </div>

      <div className="flex justify-between items-center py-3 border-y border-gray-50 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Total</p>
          <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5 text-right">Balance</p>
          <p className="font-medium text-gray-900 text-right">{formatCurrency(order.balanceOwed)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5 text-right">Items</p>
          <p className="font-medium text-gray-900 text-right">{order.items.length}</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <NativeSelect className="flex-1 h-10" value={order.status} onChange={handleStatusChange}>
          {Object.values(OrderStatus).map((value) => <option key={value} value={value}>{value}</option>)}
        </NativeSelect>
        
        <a
          href={buildWhatsAppLink(order.customerSnapshot.phone, message)}
          target="_blank"
          rel="noreferrer"
          onClick={() => updateOrder.mutate({ whatsappSent: true })}
          className="flex-shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-50"
        >
          <MessageCircle className="size-5" />
        </a>
        <button
          onClick={onDelete}
          className="flex-shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

function OrderRow({ order, onDelete }: { order: Order; onDelete: () => void }) {
  const updateOrder = useUpdateOrder(order._id);
  const vendor = useAuthStore((s) => s.vendor);
  const isPremium = vendor?.subscriptionPlan === "atelier" || vendor?.subscriptionPlan === "maison";

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as OrderStatus;
    updateOrder.mutate({ status: newStatus });

    if (isPremium) {
      let link = "";

      if (newStatus === OrderStatus.Confirmed) link = order.whatsappLinks?.confirmed || "";
      else if (newStatus === OrderStatus.Dispatched) link = order.whatsappLinks?.dispatched || "";
      else if (newStatus === OrderStatus.Completed) link = order.whatsappLinks?.completed || "";

      if (link) {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-900">Status changed to {newStatus}. Send update to customer?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Skip
              </button>
              <a 
                href={link} 
                target="_blank" 
                rel="noreferrer"
                onClick={() => {
                  toast.dismiss(t.id);
                  updateOrder.mutate({ whatsappSent: true });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#25D366] hover:bg-[#20bd5a] rounded transition-colors"
              >
                <MessageCircle className="size-3" />
                Send WhatsApp
              </a>
            </div>
          </div>
        ), { duration: 6000, id: `status-toast-${newStatus}-${order._id}` });
      }
    }
  };

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
            onChange={handleStatusChange}
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
