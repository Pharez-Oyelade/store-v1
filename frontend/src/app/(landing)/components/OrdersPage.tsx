"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Plus, Trash2, Scissors, ShoppingBag } from "lucide-react";
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

const BESPOKE_STATUS_OPTIONS = [
  { value: "inquiry", label: "Inquiry" },
  { value: "quoted", label: "Quoted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "sourcing", label: "Sourcing" },
  { value: "in_progress", label: "In Progress" },
  { value: "fitting", label: "Fitting" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const initialPayment = searchParams.get("payment") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [page, setPage] = useState(1);
  const [orderType, setOrderType] = useState<"all" | "ready_to_wear" | "bespoke">("all");
  const [status, setStatus] = useState<string>(initialStatus);
  const [payment, setPayment] = useState<string>(initialPayment);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);

  const orders = useOrders({
    page,
    limit: 15,
    type: orderType,
    status: status !== "all" ? status : undefined,
    payment: payment !== "all" ? payment : undefined,
    search: searchTerm.trim() || undefined,
  });
  const deleteOrder = useDeleteOrder();

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <PageHeader
        title="Orders & Demands"
        description="Track ready-made boutique sales, bespoke customer tailoring demands, deposits, and status."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/demands/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-700 bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <Scissors className="size-3.5" />
              <span>New Bespoke</span>
            </Link>
            <Link
              href="/dashboard/orders/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors shadow-xs"
            >
              <Plus className="size-3.5 text-white" />
              <span className="text-white">New Order</span>
            </Link>
          </div>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setOrderType("all");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                orderType === "all"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Orders
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType("ready_to_wear");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                orderType === "ready_to_wear"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ShoppingBag className="size-3.5" />
              Ready-to-Wear
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType("bespoke");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                orderType === "bespoke"
                  ? "bg-brand-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Scissors className="size-3.5" />
              Bespoke Demands
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by customer, phone, or item..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />

          <NativeSelect
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              setPage(1);
            }}
            className="text-xs h-9"
          >
            <option value="all">All Payment Statuses</option>
            <option value="unpaid">Unpaid / Open Balance (Debt)</option>
            <option value="paid">Fully Paid</option>
          </NativeSelect>

          <NativeSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs h-9"
          >
            <option value="all">All Fulfillment Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="fitting">Fitting</option>
            <option value="ready">Ready for Pickup</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </NativeSelect>
        </div>
      </div>


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
                    <th className="px-4 py-3">Customer / Client</th>
                    <th className="px-4 py-3">Type & Items</th>
                    <th className="px-4 py-3">Total Value</th>
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
          description="Create a manual order or record bespoke customer demands to manage all client requests in one place."
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
    const newStatus = event.target.value as any;
    updateOrder.mutate({ status: newStatus });

    if (isPremium) {
      let link = "";
      if (newStatus === "confirmed" || newStatus === OrderStatus.Confirmed) link = order.whatsappLinks?.confirmed || "";
      else if (newStatus === "fitting" || newStatus === OrderStatus.Dispatched) link = order.whatsappLinks?.dispatched || "";
      else if (newStatus === "completed" || newStatus === OrderStatus.Completed) link = order.whatsappLinks?.completed || "";

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
  const detailLink = order.isBespoke ? `/dashboard/demands/${order._id}` : `/dashboard/orders/${order._id}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={detailLink} className="font-semibold text-gray-900 text-base block hover:underline">
              {order.customerSnapshot.name}
            </Link>
            {order.isBespoke && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                <Scissors className="size-2.5" /> Bespoke
              </span>
            )}
          </div>
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
          {order.isBespoke
            ? BESPOKE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : Object.values(OrderStatus).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
        </NativeSelect>

        <a
          href={buildWhatsAppLink(order.customerSnapshot.phone, message)}
          target="_blank"
          rel="noreferrer"
          onClick={() => updateOrder.mutate({ whatsappSent: true })}
          className="shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-50"
        >
          <MessageCircle className="size-5" />
        </a>
        <button
          onClick={onDelete}
          className="shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
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
    const newStatus = event.target.value as any;
    updateOrder.mutate({ status: newStatus });

    if (isPremium) {
      let link = "";

      if (newStatus === "confirmed" || newStatus === OrderStatus.Confirmed) link = order.whatsappLinks?.confirmed || "";
      else if (newStatus === "fitting" || newStatus === OrderStatus.Dispatched) link = order.whatsappLinks?.dispatched || "";
      else if (newStatus === "completed" || newStatus === OrderStatus.Completed) link = order.whatsappLinks?.completed || "";

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
  const detailLink = order.isBespoke ? `/dashboard/demands/${order._id}` : `/dashboard/orders/${order._id}`;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={detailLink}
            className="font-medium text-gray-950 hover:underline"
          >
            {order.customerSnapshot.name}
          </Link>
          {order.isBespoke && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              <Scissors className="size-2.5" /> Bespoke
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{order.customerSnapshot.phone}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {order.isBespoke ? (
          <div>
            <p className="font-medium text-gray-900 truncate max-w-xs">{order.items[0]?.productName}</p>
            <p className="text-xs text-gray-400">{order.items[0]?.variantLabel}</p>
          </div>
        ) : (
          <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
        )}
      </td>
      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</td>
      <td className="px-4 py-3">
        <span className={order.balanceOwed > 0 ? "font-semibold text-amber-700" : "text-gray-600"}>
          {formatCurrency(order.balanceOwed)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge value={order.status} />
          <NativeSelect
            className="h-8 w-32 text-xs"
            value={order.status}
            onChange={handleStatusChange}
          >
            {order.isBespoke
              ? BESPOKE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : Object.values(OrderStatus).map((value) => (
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
