"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  ShoppingBag,
  Scissors,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Landmark,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCreateInvoice, usePayoutAccount } from "@/hooks/useInvoices";
import { useOrders } from "@/hooks/useOrders";
import { useCustomRequests } from "@/hooks/useCustomRequests";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface LineItemDraft {
  description: string;
  variantLabel: string;
  quantity: number | "";
  unitPrice: number | "";
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preloadOrderId = searchParams.get("orderId");
  const preloadDemandId = searchParams.get("demandId");

  const createInvoice = useCreateInvoice();

  // Mode: "custom" | "from_order" | "from_demand"
  const [mode, setMode] = useState<"custom" | "from_order" | "from_demand">(
    preloadOrderId ? "from_order" : preloadDemandId ? "from_demand" : "custom"
  );

  const [selectedOrderId, setSelectedOrderId] = useState(preloadOrderId || "");
  const [selectedDemandId, setSelectedDemandId] = useState(preloadDemandId || "");

  // Customer Snapshot
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Line Items
  const [items, setItems] = useState<LineItemDraft[]>([
    { description: "", variantLabel: "", quantity: 1, unitPrice: "" },
  ]);

  // Financial Settings
  const [alreadyPaid, setAlreadyPaid] = useState<number | "">("");
  const [depositRequired, setDepositRequired] = useState<number | "">("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "Thank you for your patronage! Please settle the remaining balance upon delivery or fitting."
  );

  // Queries for linked selections
  const ordersQuery = useOrders({ limit: 50 });
  const demandsQuery = useCustomRequests({ limit: 50 });
  const payoutQuery = usePayoutAccount();
  const isBankLinked = Boolean(
    payoutQuery.data?.isVerified && payoutQuery.data?.paystackSubaccountCode
  );

  // Filter only unpaid/incomplete orders & demands
  const eligibleOrders = useMemo(() => {
    const all = ordersQuery.data?.orders || [];
    if (!onlyUnpaid) return all;
    return all.filter((o) => {
      const paid = o.depositPaid || 0;
      const balance =
        o.balanceOwed !== undefined
          ? o.balanceOwed
          : Math.max(0, o.totalAmount - paid);
      return balance > 0;
    });
  }, [ordersQuery.data?.orders, onlyUnpaid]);

  const eligibleDemands = useMemo(() => {
    const all = demandsQuery.data?.requests || [];
    if (!onlyUnpaid) return all;
    return all.filter((d) => {
      const total = d.agreedPrice || d.estimatedPrice || 0;
      const paid = d.depositPaid || 0;
      const balance =
        d.balanceOwed !== undefined
          ? d.balanceOwed
          : Math.max(0, total - paid);
      return balance > 0;
    });
  }, [demandsQuery.data?.requests, onlyUnpaid]);

  // Handle auto-population from an Order
  useEffect(() => {
    if (mode === "from_order" && selectedOrderId && ordersQuery.data?.orders) {
      const ord = ordersQuery.data.orders.find((o) => o._id === selectedOrderId);
      if (ord) {
        setCustomerName(ord.customerSnapshot?.name || "");
        setCustomerPhone(ord.customerSnapshot?.phone || "");
        setCustomerEmail(ord.customerSnapshot?.email || "");
        setCustomerAddress((ord.customer as any)?.address || "");

        setItems(
          ord.items.map((i) => ({
            description: i.productName,
            variantLabel: i.variantLabel || "",
            quantity: i.quantity,
            unitPrice: i.price,
          }))
        );

        setAlreadyPaid(ord.depositPaid || 0);
        setDepositRequired(0);
      }
    }
  }, [mode, selectedOrderId, ordersQuery.data]);

  // Handle auto-population from a Bespoke Demand
  useEffect(() => {
    if (
      mode === "from_demand" &&
      selectedDemandId &&
      demandsQuery.data?.requests
    ) {
      const d = demandsQuery.data.requests.find((r) => r._id === selectedDemandId);
      if (d) {
        setCustomerName(d.customerSnapshot?.name || "");
        setCustomerPhone(d.customerSnapshot?.phone || "");
        setCustomerEmail(d.customerSnapshot?.email || "");

        setItems([
          {
            description: `Bespoke Tailoring: ${d.title}`,
            variantLabel: d.category ? `Category: ${d.category}` : "Bespoke Garment",
            quantity: 1,
            unitPrice: d.agreedPrice || d.estimatedPrice || "",
          },
        ]);

        setAlreadyPaid(d.depositPaid || 0);
        setDepositRequired(0);
        if (d.deadline) {
          setDueDate(new Date(d.deadline).toISOString().split("T")[0]);
        }
      }
    }
  }, [mode, selectedDemandId, demandsQuery.data]);

  // Calculate dynamic totals
  const calculatedTotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const currentPaid = Number(alreadyPaid) || 0;
  const netBalanceDue = Math.max(0, calculatedTotal - currentPaid);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", variantLabel: "", quantity: 1, unitPrice: "" },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (
    idx: number,
    field: keyof LineItemDraft,
    val: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      toast.error("All items must have a description");
      return;
    }

    try {
      const payload: any = {
        customerSnapshot: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          address: customerAddress.trim(),
        },
        items: items.map((i) => ({
          description: i.description.trim(),
          variantLabel: i.variantLabel.trim(),
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
        })),
        totalAmount: calculatedTotal,
        initialPaid: currentPaid,
        depositRequired: Number(depositRequired) || 0,
        dueDate: dueDate || undefined,
        notes: notes.trim(),
        terms: terms.trim(),
      };

      if (mode === "from_order" && selectedOrderId) {
        payload.orderId = selectedOrderId;
      } else if (mode === "from_demand" && selectedDemandId) {
        payload.customRequestId = selectedDemandId;
      }

      const invoice = await createInvoice.mutateAsync(payload);
      router.push(`/dashboard/invoices/${invoice._id}`);
    } catch {
      // toast error handled in hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/invoices"
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="text-xs text-gray-500">
            Issue a live shareable link with real-time balance calculations and online checkout.
          </p>
        </div>
      </div>

      {/* Account not connected notice */}
      {!isBankLinked && !payoutQuery.isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <Landmark className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Settlement bank account not connected</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                You can create this invoice now, but customers won't be able to pay online or see your transfer details until you connect your Nigerian bank account in Settings.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=payouts"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shrink-0 shadow-xs transition-colors whitespace-nowrap"
          >
            <span>Connect Bank</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Creation Source Selection */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Invoice Source
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === "custom"
                  ? "border-brand-600 bg-brand-50/50 text-brand-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4 mb-1.5 text-brand-600" />
              <p className="text-xs font-bold">Custom Line Items</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Start from scratch</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("from_order")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === "from_order"
                  ? "border-brand-600 bg-brand-50/50 text-brand-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <ShoppingBag className="w-4 h-4 mb-1.5 text-emerald-600" />
              <p className="text-xs font-bold">From Ready Order</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Import products & prices</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("from_demand")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === "from_demand"
                  ? "border-brand-600 bg-brand-50/50 text-brand-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <Scissors className="w-4 h-4 mb-1.5 text-indigo-600" />
              <p className="text-xs font-bold">From Bespoke Demand</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Import tailor agreed quote</p>
            </button>
          </div>

          {/* Source Dropdowns */}
          {mode === "from_order" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Select Existing Order
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyUnpaid}
                    onChange={(e) => setOnlyUnpaid(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Show only unpaid / incomplete orders</span>
                </label>
              </div>

              {ordersQuery.isLoading ? (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-400 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-brand-600" />
                  <span>Loading orders...</span>
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">-- Choose an order --</option>
                  {eligibleOrders.length === 0 ? (
                    <option value="" disabled>
                      No unpaid or incomplete orders found
                    </option>
                  ) : (
                    eligibleOrders.map((o) => {
                      const paid = o.depositPaid || 0;
                      const balance =
                        o.balanceOwed !== undefined
                          ? o.balanceOwed
                          : Math.max(0, o.totalAmount - paid);
                      return (
                        <option key={o._id} value={o._id}>
                          {o.customerSnapshot?.name} — Total: {formatCurrency(o.totalAmount)} | Paid: {formatCurrency(paid)} | Balance Due: {formatCurrency(balance)}
                        </option>
                      );
                    })
                  )}
                </select>
              )}
            </div>
          )}

          {mode === "from_demand" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Select Bespoke Demand
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyUnpaid}
                    onChange={(e) => setOnlyUnpaid(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Show only unpaid / incomplete demands</span>
                </label>
              </div>

              {demandsQuery.isLoading ? (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-400 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-brand-600" />
                  <span>Loading bespoke demands...</span>
                </div>
              ) : (
                <select
                  value={selectedDemandId}
                  onChange={(e) => setSelectedDemandId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">-- Choose a bespoke demand --</option>
                  {eligibleDemands.length === 0 ? (
                    <option value="" disabled>
                      No unpaid or incomplete bespoke demands found
                    </option>
                  ) : (
                    eligibleDemands.map((d) => {
                      const total = d.agreedPrice || d.estimatedPrice || 0;
                      const paid = d.depositPaid || 0;
                      const balance =
                        d.balanceOwed !== undefined
                          ? d.balanceOwed
                          : Math.max(0, total - paid);
                      return (
                        <option key={d._id} value={d._id}>
                          {d.customerSnapshot?.name} — {d.title} | Total: {formatCurrency(total)} | Paid: {formatCurrency(paid)} | Balance Due: {formatCurrency(balance)}
                        </option>
                      );
                    })
                  )}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-600" />
            <span>Customer Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Aisha Bello"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. aisha@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Delivery Address (Optional)
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="e.g. Lekki Phase 1, Lagos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Invoice Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Item description / garment name"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>

                <div className="w-full sm:w-36">
                  <input
                    type="text"
                    value={item.variantLabel}
                    onChange={(e) => updateItem(idx, "variantLabel", e.target.value)}
                    placeholder="Variant / Color (opt)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "quantity",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-center font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "unitPrice",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Price ₦"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>

                <div className="w-24 text-right hidden sm:block">
                  <span className="text-xs font-bold text-gray-900">
                    {formatCurrency(
                      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal & Balance Breakdown */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Total Items Amount:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(calculatedTotal)}</span>
            </div>

            {Number(alreadyPaid) > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold">
                <span>Less: Already Paid (Prior Deposit Credited):</span>
                <span>- {formatCurrency(Number(alreadyPaid))}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
              <div>
                <span className="text-sm font-bold text-gray-900">Balance Due on Invoice:</span>
                <p className="text-[11px] text-gray-400">Net outstanding balance customer will be billed</p>
              </div>
              <span
                className={`text-xl font-extrabold ${
                  netBalanceDue > 0 ? "text-brand-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(netBalanceDue)}
              </span>
            </div>

            {netBalanceDue === 0 && calculatedTotal > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2 border border-emerald-200 mt-1">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>
                  This order is already <strong>Fully Paid</strong>. If you issue this invoice, it will be marked as <strong>Paid in Full</strong> with ₦0 remaining balance.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Deposit & Due Date */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Payment Terms & Due Date
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Already Paid / Prior Deposit (₦)
              </label>
              <input
                type="number"
                min="0"
                max={calculatedTotal}
                value={alreadyPaid}
                onChange={(e) =>
                  setAlreadyPaid(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Paid outside this invoice (cash, POS, or transfer). Credited against total.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Min. Upfront Deposit Required (₦)
              </label>
              <input
                type="number"
                min="0"
                max={netBalanceDue}
                value={depositRequired}
                onChange={(e) =>
                  setDepositRequired(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="0 (leave empty for full balance)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Minimum upfront payment customer can make before paying remainder.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer Notes / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please bring sample fabric to fitting on Saturday."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/invoices"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createInvoice.isPending}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {createInvoice.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Invoice...</span>
              </>
            ) : (
              <span>Create & Issue Live Invoice</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
