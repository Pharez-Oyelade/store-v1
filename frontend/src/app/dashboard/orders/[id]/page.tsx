"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Save } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  FieldLabel,
  NativeSelect,
  PageHeader,
  StatusBadge,
  TableShell,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import { useOrder, useUpdateOrder } from "@/hooks/useOrders";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatus, type Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const order = useOrder(params.id);
  const updateOrder = useUpdateOrder(params.id);

  if (order.isLoading)
    return <p className="text-sm text-gray-500">Loading order...</p>;
  if (!order.data) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been deleted or belongs to another vendor account."
        href="/dashboard/orders"
        actionLabel="Back to orders"
      />
    );
  }

  let whatsappLink = order.data.whatsappLinks?.confirmed;
  let whatsappLabel = "WhatsApp Confirmed";

  if (order.data.status === OrderStatus.Dispatched) {
    whatsappLink = order.data.whatsappLinks?.dispatched;
    whatsappLabel = "WhatsApp Dispatched";
  } else if (order.data.status === OrderStatus.Completed) {
    whatsappLink = order.data.whatsappLinks?.completed;
    whatsappLabel = "WhatsApp Completed";
  }

  if (!whatsappLink) {
    const message = buildOrderMessage(order.data);
    whatsappLink = buildWhatsAppLink(order.data.customerSnapshot.phone, message);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to orders
        </Link>
      </div>
      <PageHeader
        title={`Order for ${order.data.customerSnapshot.name}`}
        description={`Created ${formatDate(order.data.createdAt)} from ${order.data.source.replace("_", " ")}.`}
        action={
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => updateOrder.mutate({ whatsappSent: true })}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <MessageCircle className="size-4 text-white" />
            <span className="text-white">{whatsappLabel}</span>
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6 min-w-0">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">Items</h2>
              <StatusBadge value={order.data.status} />
            </div>
            <TableShell>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Variant</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.data.items.map((item, index) => (
                    <tr key={`${item.productName}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-950">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3">{item.variantLabel}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-gray-950">
              Customer
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Info label="Name" value={order.data.customerSnapshot.name} />
              <Info label="Phone" value={order.data.customerSnapshot.phone} />
              <Info
                label="Email"
                value={order.data.customerSnapshot.email || "Not provided"}
              />
            </div>
          </div>
        </section>

        <OrderControl order={order.data} updateOrder={updateOrder} />
      </div>
    </div>
  );
}

function OrderControl({
  order,
  updateOrder,
}: {
  order: Order;
  updateOrder: ReturnType<typeof useUpdateOrder>;
}) {
  const vendor = useAuthStore((s) => s.vendor);
  const isPremium = vendor?.subscriptionPlan === "atelier" || vendor?.subscriptionPlan === "maison";

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as OrderStatus;
    updateOrder.mutate({ status: newStatus });

    if (isPremium) {
      let link = "";
      let label = "";

      if (newStatus === OrderStatus.Confirmed) {
        link = order.whatsappLinks?.confirmed || "";
        label = "Order Confirmed";
      } else if (newStatus === OrderStatus.Dispatched) {
        link = order.whatsappLinks?.dispatched || "";
        label = "Order Dispatched";
      } else if (newStatus === OrderStatus.Completed) {
        link = order.whatsappLinks?.completed || "";
        label = "Order Completed";
      }

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
        ), { duration: 6000, id: `status-toast-${newStatus}` });
      }
    }
  };

  return (
    <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-gray-950">Manage order</h2>
      <div className="space-y-1.5">
        <FieldLabel>Status</FieldLabel>
        <NativeSelect
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
      <Input
        label="Deposit paid"
        type="number"
        min={0}
        defaultValue={order.depositPaid}
        onBlur={(event) =>
          updateOrder.mutate({ depositPaid: Number(event.target.value) })
        }
      />
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex justify-between">
          <span>Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Balance</span>
          <strong>{formatCurrency(order.balanceOwed)}</strong>
        </div>
        <div className="flex justify-between">
          <span>WhatsApp sent</span>
          <strong>{order.whatsappSent ? "Yes" : "No"}</strong>
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Notes</FieldLabel>
        <TextArea
          defaultValue={order.notes ?? ""}
          onBlur={(event) => updateOrder.mutate({ notes: event.target.value })}
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-950 mb-3">Send Updates</h3>
        <div className="space-y-2">
          <a
            href={order.whatsappLinks?.confirmed || buildWhatsAppLink(order.customerSnapshot.phone, buildOrderMessage(order))}
            target="_blank"
            rel="noreferrer"
            onClick={() => updateOrder.mutate({ whatsappSent: true })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
            Order Confirmed
          </a>
          <a
            href={order.whatsappLinks?.dispatched || buildWhatsAppLink(order.customerSnapshot.phone, "Your order has been dispatched!")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
            Order Dispatched
          </a>
          <a
            href={order.whatsappLinks?.completed || buildWhatsAppLink(order.customerSnapshot.phone, "Thank you for shopping with us!")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
            Order Completed
          </a>
        </div>
      </div>

      <Button
        type="button"
        isLoading={updateOrder.isPending}
        leftIcon={<Save className="size-4" />}
        className="w-full mt-4"
      >
        Saved automatically
      </Button>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-950">{value}</p>
    </div>
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
    `Hi ${order.customerSnapshot.name}, your Vendra order is confirmed.`,
    "",
    lines,
    "",
    `Total: ${formatCurrency(order.totalAmount)}`,
    `Deposit: ${formatCurrency(order.depositPaid)}`,
    `Balance: ${formatCurrency(order.balanceOwed)}`,
  ].join("\n");
}
