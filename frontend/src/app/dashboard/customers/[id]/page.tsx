"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Save } from "lucide-react";
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
  const [measurements, setMeasurements] = useState<
    { key: string; value: string }[]
  >([]);

  useEffect(() => {
    if (!customer.data) return;
    setNotes(customer.data.notes ?? "");
    setTags(customer.data.tags.join(", "));
    setEmail(customer.data.email ?? "");
    setInstagram(customer.data.instagram ?? "");

    if (customer.data.measurements) {
      const parsed = Object.entries(customer.data.measurements).map(
        ([k, v]) => ({ key: k, value: v }),
      );
      setMeasurements(parsed);
    } else {
      setMeasurements([]);
    }
  }, [customer.data]);

  if (customer.isLoading)
    return <p className="text-sm text-gray-500">Loading customer...</p>;
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
    const measurementsObj: Record<string, string> = {};
    measurements.forEach((m) => {
      if (m.key.trim() && m.value.trim()) {
        measurementsObj[m.key.trim()] = m.value.trim();
      }
    });

    updateCustomer.mutate({
      notes,
      email,
      instagram,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      measurements: measurementsObj,
    });
  }

  function addMeasurement() {
    setMeasurements([...measurements, { key: "", value: "" }]);
  }

  function updateMeasurement(
    index: number,
    field: "key" | "value",
    val: string,
  ) {
    const updated = [...measurements];
    updated[index][field] = val;
    setMeasurements(updated);
  }

  function removeMeasurement(index: number) {
    const updated = measurements.filter((_, i) => i !== index);
    setMeasurements(updated);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to customers
        </Link>
      </div>
      <PageHeader
        title={customer.data.name}
        description={`${customer.data.orderCount} completed orders · ${formatCurrency(customer.data.ltv)} lifetime value`}
        action={
          <a
            href={buildWhatsAppLink(customer.data.phone)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            <MessageCircle className="size-4 text-white" />
            <span className="text-white">Whatsapp</span>
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-base font-semibold text-gray-950">
              Order history
            </h2>
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
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">{order.items.length}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(order.balanceOwed)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <p className="text-sm text-gray-500">
                No recent orders for this customer.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">
                Measurements
              </h2>
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={addMeasurement}
              >
                Add measurement
              </Button>
            </div>

            {measurements.length > 0 ? (
              <div className="space-y-3">
                {measurements.map((m, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      placeholder="E.g. Chest"
                      value={m.key}
                      onChange={(e) =>
                        updateMeasurement(index, "key", e.target.value)
                      }
                      containerClassName="flex-1"
                    />
                    <Input
                      placeholder="E.g. 40 inches"
                      value={m.value}
                      onChange={(e) =>
                        updateMeasurement(index, "value", e.target.value)
                      }
                      containerClassName="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeMeasurement(index)}
                      className="text-gray-400 hover:text-error-600 transition-colors"
                      aria-label="Remove measurement"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No measurements recorded.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card h-fit">
          <h2 className="text-base font-semibold text-gray-950">CRM details</h2>
          <Input label="Phone" value={customer.data.phone} disabled />
          <Input
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Instagram"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
          <Input
            label="Tags"
            helper="Comma-separated"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <TextArea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <Button
            type="button"
            isLoading={updateCustomer.isPending}
            leftIcon={<Save className="size-4" />}
            className="w-full"
            onClick={saveCustomer}
          >
            Save customer
          </Button>
        </aside>
      </div>
    </div>
  );
}
