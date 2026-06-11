"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Save, Plus } from "lucide-react";
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
import { useSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import { SupplierStatus, SupplierCategory, type SupplierPurchase } from "@/types";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const supplier = useSupplier(params.id);
  const updateSupplier = useUpdateSupplier(params.id);

  // Supplier basic details state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState("");
  const [status, setStatus] = useState<SupplierStatus>(SupplierStatus.Active);
  const [category, setCategory] = useState<SupplierCategory>(SupplierCategory.Fabric);
  
  // Purchases state
  const [showNewPurchase, setShowNewPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    description: "",
    amount: 0,
    paidAmount: 0,
    status: "ordered" as "ordered" | "delivered",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!supplier.data) return;
    setName(supplier.data.name);
    setPhone(supplier.data.phone);
    setEmail(supplier.data.email ?? "");
    setLocation(supplier.data.location ?? "");
    setNotes(supplier.data.notes ?? "");
    setMaterials(supplier.data.materials.join(", "));
    setStatus(supplier.data.status);
    setCategory(supplier.data.category);
  }, [supplier.data]);

  if (supplier.isLoading) return <p className="text-sm text-gray-500">Loading supplier...</p>;
  if (!supplier.data) {
    return (
      <EmptyState
        title="Supplier not found"
        description="This supplier may have been deleted or belongs to another vendor account."
        href="/dashboard/suppliers"
        actionLabel="Back to suppliers"
      />
    );
  }

  function saveSupplier() {
    updateSupplier.mutate({
      name,
      phone,
      email,
      location,
      notes,
      status,
      category,
      materials,
    });
  }

  function addPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!newPurchase.description || newPurchase.amount <= 0) return;
    
    const updatedPurchases = [...(supplier.data?.purchases || []), newPurchase];
    updateSupplier.mutate({ purchases: updatedPurchases as any }, {
      onSuccess: () => {
        setShowNewPurchase(false);
        setNewPurchase({
          description: "",
          amount: 0,
          paidAmount: 0,
          status: "ordered",
          date: new Date().toISOString().slice(0, 10),
        });
      }
    });
  }

  function updatePurchaseField(index: number, field: "status" | "paidAmount", value: any) {
    const updatedPurchases = [...(supplier.data?.purchases || [])];
    (updatedPurchases[index] as any)[field] = value;
    updateSupplier.mutate({ purchases: updatedPurchases as any });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link href="/dashboard/suppliers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-2 size-4" />
          Back to suppliers
        </Link>
      </div>
      <PageHeader
        title={supplier.data.name}
        description={`${supplier.data.category} supplier · ${formatCurrency(supplier.data.outstandingBalance)} outstanding`}
        action={
          <a href={buildWhatsAppLink(supplier.data.phone)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800">
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-950">Purchases</h2>
              <Button type="button" variant="outline" size="small" onClick={() => setShowNewPurchase(!showNewPurchase)}>
                {showNewPurchase ? "Cancel" : "Add Purchase"}
              </Button>
            </div>

            {showNewPurchase && (
              <form onSubmit={addPurchase} className="mb-6 grid gap-4 rounded-md bg-gray-50 p-4 border border-gray-100">
                <Input 
                  label="Description / Items" 
                  value={newPurchase.description} 
                  onChange={e => setNewPurchase({...newPurchase, description: e.target.value})} 
                  required 
                />
                <div className="grid gap-4 sm:grid-cols-4">
                  <Input 
                    label="Amount" 
                    type="number" 
                    min={0} 
                    value={newPurchase.amount} 
                    onChange={e => setNewPurchase({...newPurchase, amount: Number(e.target.value)})} 
                    required 
                  />
                  <Input 
                    label="Paid Amount" 
                    type="number" 
                    min={0} 
                    value={newPurchase.paidAmount} 
                    onChange={e => setNewPurchase({...newPurchase, paidAmount: Number(e.target.value)})} 
                  />
                  <div className="space-y-1.5">
                    <FieldLabel>Status</FieldLabel>
                    <NativeSelect
                      value={newPurchase.status}
                      onChange={e => setNewPurchase({...newPurchase, status: e.target.value as any})}
                    >
                      <option value="ordered">Ordered</option>
                      <option value="delivered">Delivered</option>
                    </NativeSelect>
                  </div>
                  <Input 
                    label="Date" 
                    type="date" 
                    value={newPurchase.date} 
                    onChange={e => setNewPurchase({...newPurchase, date: e.target.value})} 
                    required 
                  />
                </div>
                <Button type="submit" isLoading={updateSupplier.isPending}>Save Purchase</Button>
              </form>
            )}

            {supplier.data.purchases && supplier.data.purchases.length > 0 ? (
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplier.data.purchases.map((purchase, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-500">{formatDate(purchase.date)}</td>
                        <td className="px-4 py-3 font-medium">{purchase.description}</td>
                        <td className="px-4 py-3">{formatCurrency(purchase.amount)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            className="w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={purchase.paidAmount ?? 0}
                            onChange={(e) => updatePurchaseField(index, "paidAmount", Number(e.target.value))}
                            onBlur={(e) => updatePurchaseField(index, "paidAmount", Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <NativeSelect
                            className="h-8 w-28 text-xs"
                            value={purchase.status}
                            onChange={(e) => updatePurchaseField(index, "status", e.target.value)}
                            disabled={updateSupplier.isPending}
                          >
                            <option value="ordered">Ordered</option>
                            <option value="delivered">Delivered</option>
                          </NativeSelect>
                        </td>
                      </tr>
                    )).reverse()}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <p className="text-sm text-gray-500">No purchases recorded for this supplier.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card h-fit">
          <h2 className="text-base font-semibold text-gray-950">Supplier details</h2>
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <Input label="Materials" helper="Comma-separated" value={materials} onChange={e => setMaterials(e.target.value)} />
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Category</FieldLabel>
              <NativeSelect value={category} onChange={e => setCategory(e.target.value as SupplierCategory)}>
                {Object.values(SupplierCategory).map(v => <option key={v} value={v}>{v}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <NativeSelect value={status} onChange={e => setStatus(e.target.value as SupplierStatus)}>
                {Object.values(SupplierStatus).map(v => <option key={v} value={v}>{v}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <TextArea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          
          <Button type="button" isLoading={updateSupplier.isPending} leftIcon={<Save className="size-4" />} className="w-full" onClick={saveSupplier}>
            Save changes
          </Button>
        </aside>
      </div>
    </div>
  );
}
