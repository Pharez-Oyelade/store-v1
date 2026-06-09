"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageCircle, Save } from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  FieldLabel,
  PageHeader,
  StatusBadge,
  TableShell,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import { useCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customer = useCustomer(params.id);
  const updateCustomer = useUpdateCustomer(params.id);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    if (!customer.data) return;
    setNotes(customer.data.notes ?? "");
    setTags(customer.data.tags.join(", "));
    setEmail(customer.data.email ?? "");
    setInstagram(customer.data.instagram ?? "");
  }, [customer.data]);

  if (customer.isLoading) return <p className="text-sm text-gray-500">Loading customer...</p>;
  if (!customer.data) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been deleted or belongs to another vendor account."
        href="/dashboard/customers"
        actionLabel="Back to customers"
      />
    );
  }

  function saveCustomer() {
    updateCustomer.mutate({
      notes,
      email,
      instagram,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={customer.data.name}
        description={`${customer.data.orderCount} completed orders · ${formatCurrency(customer.data.ltv)} lifetime value`}
        action={
          <a href={buildWhatsAppLink(customer.data.phone)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800">
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-gray-950">Order history</h2>
          {customer.data.orders.length ? (
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.data.orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">{order.items.length}</td>
                      <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(order.balanceOwed)}</td>
                      <td className="px-4 py-3"><StatusBadge value={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <p className="text-sm text-gray-500">No recent orders for this customer.</p>
          )}
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-gray-950">CRM details</h2>
          <Input label="Phone" value={customer.data.phone} disabled />
          <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Instagram" value={instagram} onChange={(event) => setInstagram(event.target.value)} />
          <Input label="Tags" helper="Comma-separated" value={tags} onChange={(event) => setTags(event.target.value)} />
          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <Button type="button" isLoading={updateCustomer.isPending} leftIcon={<Save className="size-4" />} className="w-full" onClick={saveCustomer}>
            Save customer
          </Button>
        </aside>
      </div>
    </div>
  );
}
