"use client";

import { useParams } from "next/navigation";
import { MessageCircle, Save } from "lucide-react";
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

  if (order.isLoading) return <p className="text-sm text-gray-500">Loading order...</p>;
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

  const message = buildOrderMessage(order.data);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Order for ${order.data.customerSnapshot.name}`}
        description={`Created ${formatDate(order.data.createdAt)} from ${order.data.source.replace("_", " ")}.`}
        action={
          <a
            href={buildWhatsAppLink(order.data.customerSnapshot.phone, message)}
            target="_blank"
            rel="noreferrer"
            onClick={() => updateOrder.mutate({ whatsappSent: true })}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">Items</h2>
              <StatusBadge value={order.data.status} />
            </div>
            <TableShell>
              <table className="min-w-full text-left text-sm">
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
                      <td className="px-4 py-3 font-medium text-gray-950">{item.productName}</td>
                      <td className="px-4 py-3">{item.variantLabel}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-gray-950">Customer</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Info label="Name" value={order.data.customerSnapshot.name} />
              <Info label="Phone" value={order.data.customerSnapshot.phone} />
              <Info label="Email" value={order.data.customerSnapshot.email || "Not provided"} />
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
  return (
    <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-gray-950">Manage order</h2>
      <div className="space-y-1.5">
        <FieldLabel>Status</FieldLabel>
        <NativeSelect value={order.status} onChange={(event) => updateOrder.mutate({ status: event.target.value as OrderStatus })}>
          {Object.values(OrderStatus).map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </NativeSelect>
      </div>
      <Input
        label="Deposit paid"
        type="number"
        min={0}
        defaultValue={order.depositPaid}
        onBlur={(event) => updateOrder.mutate({ depositPaid: Number(event.target.value) })}
      />
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex justify-between"><span>Total</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
        <div className="flex justify-between"><span>Balance</span><strong>{formatCurrency(order.balanceOwed)}</strong></div>
        <div className="flex justify-between"><span>WhatsApp sent</span><strong>{order.whatsappSent ? "Yes" : "No"}</strong></div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Notes</FieldLabel>
        <TextArea defaultValue={order.notes ?? ""} onBlur={(event) => updateOrder.mutate({ notes: event.target.value })} />
      </div>
      <Button type="button" isLoading={updateOrder.isPending} leftIcon={<Save className="size-4" />} className="w-full">
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
    .map((item) => `${item.productName} (${item.variantLabel}) x ${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
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
