"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  FieldLabel,
  NativeSelect,
  PageHeader,
  StatCard,
  StatusBadge,
  TableShell,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSupplierSummary,
  useSuppliers,
  useUpdateSupplier,
} from "@/hooks/useSuppliers";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import { SupplierCategory, SupplierStatus, type Supplier } from "@/types";
import { Banknote, Handshake, Star, WalletCards } from "lucide-react";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const suppliers = useSuppliers({ page: 1, limit: 50, search });
  const summary = useSupplierSummary();
  const deleteSupplier = useDeleteSupplier();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Suppliers"
        description="Manage the material vendors, makers, packaging partners and tool suppliers behind production."
        action={
          <Button
            type="button"
            leftIcon={<Plus className="size-4" />}
            onClick={() => setSelected(null)}
          >
            New supplier
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total suppliers"
          value={String(summary.data?.total ?? 0)}
          icon={Handshake}
        />
        <StatCard
          label="Preferred"
          value={String(summary.data?.preferred ?? 0)}
          icon={Star}
          tone="amber"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.data?.outstandingBalance ?? 0)}
          icon={WalletCards}
          tone="rose"
        />
        <StatCard
          label="Last purchase total"
          value={formatCurrency(summary.data?.lastPurchaseTotal ?? 0)}
          icon={Banknote}
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <div className="mb-4">
            <Input
              placeholder="Search suppliers or materials"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftElement={<Search className="size-4" />}
            />
          </div>

          {suppliers.data?.suppliers.length ? (
            <TableShell>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Materials</th>
                    <th className="px-4 py-3">Last purchase</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.data.suppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(supplier)}
                          className="text-left font-medium text-gray-950"
                        >
                          {supplier.name}
                        </button>
                        <p className="text-xs text-gray-500">
                          {supplier.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {supplier.materials.slice(0, 3).map((material) => (
                            <span
                              key={material}
                              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p>{formatCurrency(supplier.lastPurchaseAmount)}</p>
                        <p className="text-xs text-gray-500">
                          {supplier.lastPurchaseDate
                            ? formatDate(supplier.lastPurchaseDate)
                            : "No date"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(supplier.outstandingBalance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={supplier.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <a
                            href={buildWhatsAppLink(
                              supplier.whatsapp || supplier.phone,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-50"
                            aria-label="WhatsApp supplier"
                          >
                            <MessageCircle className="size-4" />
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${supplier.name}?`))
                                deleteSupplier.mutate(supplier._id);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
                            aria-label="Delete supplier"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <EmptyState
              title="No suppliers yet"
              description="Add the fabric shops, trim vendors, packaging partners and tool suppliers you buy from."
            />
          )}
        </section>

        <SupplierForm supplier={selected} onSaved={() => setSelected(null)} />
      </div>
    </div>
  );
}

function SupplierForm({
  supplier,
  onSaved,
}: {
  supplier: Supplier | null;
  onSaved: () => void;
}) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier(supplier?._id ?? "");
  const [form, setForm] = useState({
    name: "",
    category: SupplierCategory.Fabric,
    contactName: "",
    phone: "",
    email: "",
    instagram: "",
    whatsapp: "",
    location: "",
    materials: "",
    notes: "",
    status: SupplierStatus.Active,
    lastPurchaseAmount: 0,
    outstandingBalance: 0,
    lastPurchaseDate: "",
  });

  useEffect(() => {
    if (!supplier) {
      setForm({
        name: "",
        category: SupplierCategory.Fabric,
        contactName: "",
        phone: "",
        email: "",
        instagram: "",
        whatsapp: "",
        location: "",
        materials: "",
        notes: "",
        status: SupplierStatus.Active,
        lastPurchaseAmount: 0,
        outstandingBalance: 0,
        lastPurchaseDate: "",
      });
      return;
    }

    setForm({
      name: supplier.name,
      category: supplier.category,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone,
      email: supplier.email ?? "",
      instagram: supplier.instagram ?? "",
      whatsapp: supplier.whatsapp ?? "",
      location: supplier.location ?? "",
      materials: supplier.materials.join(", "),
      notes: supplier.notes ?? "",
      status: supplier.status,
      lastPurchaseAmount: supplier.lastPurchaseAmount,
      outstandingBalance: supplier.outstandingBalance,
      lastPurchaseDate: supplier.lastPurchaseDate?.slice(0, 10) ?? "",
    });
  }, [supplier]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (supplier) await updateSupplier.mutateAsync(form);
    else await createSupplier.mutateAsync(form);
    onSaved();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-950">
          {supplier ? "Edit supplier" : "Add supplier"}
        </h2>
        <p className="text-sm text-gray-500">
          Track contact details, materials and balances.
        </p>
      </div>
      <Input
        label="Supplier name"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FieldLabel>Category</FieldLabel>
          <NativeSelect
            value={form.category}
            onChange={(event) =>
              update("category", event.target.value as SupplierCategory)
            }
          >
            {Object.values(SupplierCategory).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Status</FieldLabel>
          <NativeSelect
            value={form.status}
            onChange={(event) =>
              update("status", event.target.value as SupplierStatus)
            }
          >
            {Object.values(SupplierStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <Input
        label="Contact name"
        value={form.contactName}
        onChange={(event) => update("contactName", event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          required
        />
        <Input
          label="WhatsApp"
          value={form.whatsapp}
          onChange={(event) => update("whatsapp", event.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
        />
        <Input
          label="Instagram"
          value={form.instagram}
          onChange={(event) => update("instagram", event.target.value)}
        />
      </div>
      <Input
        label="Location"
        value={form.location}
        onChange={(event) => update("location", event.target.value)}
      />
      <Input
        label="Materials"
        helper="Comma-separated"
        value={form.materials}
        onChange={(event) => update("materials", event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Last purchase"
          type="number"
          min={0}
          value={form.lastPurchaseAmount}
          onChange={(event) =>
            update("lastPurchaseAmount", Number(event.target.value))
          }
        />
        <Input
          label="Outstanding balance"
          type="number"
          min={0}
          value={form.outstandingBalance}
          onChange={(event) =>
            update("outstandingBalance", Number(event.target.value))
          }
        />
      </div>
      <Input
        label="Last purchase date"
        type="date"
        value={form.lastPurchaseDate}
        onChange={(event) => update("lastPurchaseDate", event.target.value)}
      />
      <div className="space-y-1.5">
        <FieldLabel>Notes</FieldLabel>
        <TextArea
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
        />
      </div>
      <Button
        type="submit"
        isLoading={createSupplier.isPending || updateSupplier.isPending}
        className="w-full"
      >
        {supplier ? "Save supplier" : "Create supplier"}
      </Button>
    </form>
  );
}
