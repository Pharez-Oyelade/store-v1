"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Save,
  FileText,
  Truck,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
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

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    street: "",
    city: "",
    state: "",
    deliveryFee: 0,
  });

  useEffect(() => {
    if (order.data) {
      setDeliveryForm({
        street: order.data.deliveryAddress?.street || "",
        city: order.data.deliveryAddress?.city || "",
        state: order.data.deliveryAddress?.state || "",
        deliveryFee: order.data.deliveryFee || 0,
      });
    }
  }, [order.data]);

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
    whatsappLink = buildWhatsAppLink(
      order.data.customerSnapshot.phone,
      message,
    );
  }

  const hasDeliveryAddress = Boolean(
    order.data.deliveryAddress?.street ||
      order.data.deliveryAddress?.city ||
      order.data.deliveryAddress?.state
  );

  const handleCopyFullAddress = () => {
    const addr = order.data?.deliveryAddress;
    const text = [
      `Recipient: ${order.data?.customerSnapshot.name}`,
      `Phone: ${order.data?.customerSnapshot.phone}`,
      `Delivery Address: ${addr?.street || ""}${addr?.city ? `, ${addr.city}` : ""}${addr?.state ? `, ${addr.state}` : ""}`,
      order.data?.notes ? `Note: ${order.data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    toast.success("Delivery address copied for dispatch rider!");
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrder.mutateAsync({
        deliveryAddress: {
          street: deliveryForm.street.trim(),
          city: deliveryForm.city.trim(),
          state: deliveryForm.state.trim(),
        },
        deliveryFee: Number(deliveryForm.deliveryFee) || 0,
      });
      setIsEditingDelivery(false);
      toast.success("Delivery information updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update delivery address");
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-16">
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
          <div className="flex items-center gap-2 flex-wrap">
            {order.data.invoice ? (
              <>
                <Link
                  href={`/dashboard/invoices/${order.data.invoice._id}`}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors shadow-2xs"
                >
                  <FileText className="size-4 text-brand-700" />
                  <span>
                    Invoice #{order.data.invoice.invoiceNumber}
                    {order.data.invoice.balanceDue > 0
                      ? ` (${formatCurrency(order.data.invoice.balanceDue)} left)`
                      : " (Paid)"}
                  </span>
                </Link>
                {order.data.invoice.balanceDue > 0 && (
                  <a
                    href={`https://wa.me/${order.data.customerSnapshot?.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hi ${order.data.customerSnapshot?.name || "Customer"}, here is your invoice #${order.data.invoice.invoiceNumber}.\n\nTotal: ${formatCurrency(order.data.invoice.totalAmount)}\nBalance Due: ${formatCurrency(order.data.invoice.balanceDue)}\n\nView invoice, pay online, or see transfer details here:\n${typeof window !== "undefined" ? window.location.origin : ""}/i/${order.data.invoice.accessToken}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    <MessageCircle className="size-4 text-white" />
                    <span className="text-white">Resend Invoice</span>
                  </a>
                )}
              </>
            ) : (
              <Link
                href={`/dashboard/invoices/new?orderId=${order.data._id}`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <FileText className="size-4 text-brand-700" />
                <span>Generate Invoice</span>
              </Link>
            )}
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
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6 min-w-0">
          {/* Order Items Table */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
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
                      <td className="px-4 py-3 text-stone-600">{item.variantLabel}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>

          {/* Customer & Delivery Information Split Card */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Details */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-600" />
                  Customer
                </h2>
                {order.data.customer?._id && (
                  <Link
                    href={`/dashboard/customers/${order.data.customer._id}`}
                    className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1"
                  >
                    <span>Profile</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Full Name</span>
                  <p className="font-semibold text-gray-950">{order.data.customerSnapshot.name}</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Phone Number</span>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{order.data.customerSnapshot.phone}</p>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${order.data.customerSnapshot.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                      <a
                        href={`tel:${order.data.customerSnapshot.phone}`}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Call"
                      >
                        <Phone size={14} />
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Email</span>
                  <p className="text-gray-700">
                    {order.data.customerSnapshot.email || (
                      <span className="text-gray-400 font-normal italic">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery & Shipping Details */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Truck size={16} className="text-brand-600" />
                  Delivery & Shipping
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingDelivery((prev) => !prev)}
                  className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  <span>{isEditingDelivery ? "Cancel" : "Edit"}</span>
                </button>
              </div>

              {isEditingDelivery ? (
                /* Editable Delivery Form */
                <form onSubmit={handleSaveDelivery} className="space-y-3 pt-1 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                      value={deliveryForm.street}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({ ...prev, street: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lekki"
                        value={deliveryForm.city}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({ ...prev, city: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lagos"
                        value={deliveryForm.state}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({ ...prev, state: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Delivery Fee (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={deliveryForm.deliveryFee}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryFee: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                  </div>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="submit"
                      disabled={updateOrder.isPending}
                      className="flex-1 rounded-lg bg-brand-700 py-2 text-xs font-bold text-white hover:bg-brand-800 transition-colors disabled:opacity-50"
                    >
                      {updateOrder.isPending ? "Saving..." : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingDelivery(false)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Display View */
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Street Address</span>
                    <p className="font-semibold text-gray-950">
                      {order.data.deliveryAddress?.street || (
                        <span className="text-gray-400 font-normal italic">
                          No street address entered (pickup or direct DM)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">City / Area</span>
                      <p className="font-medium text-gray-900">
                        {order.data.deliveryAddress?.city || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">State</span>
                      <p className="font-medium text-gray-900">
                        {order.data.deliveryAddress?.state || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Delivery Fee</span>
                      <p className="font-bold text-gray-900">
                        {order.data.deliveryFee && order.data.deliveryFee > 0
                          ? formatCurrency(order.data.deliveryFee)
                          : "Free / Included"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Channel / Source</span>
                      <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 capitalize">
                        {order.data.source || "Storefront"}
                      </span>
                    </div>
                  </div>

                  {hasDeliveryAddress && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCopyFullAddress}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors"
                      >
                        {copiedAddress ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-700">Address Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="text-gray-500" />
                            <span>Copy Address for Dispatch / Rider</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Order Controls & Summary */}
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
  const isPremium =
    vendor?.subscriptionPlan === "atelier" ||
    vendor?.subscriptionPlan === "maison";

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
        toast(
          (t) => (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-900">
                Status changed to {newStatus}. Send update to customer?
              </p>
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
          ),
          { duration: 6000, id: `status-toast-${newStatus}` },
        );
      }
    }
  };

  const itemsSubtotal = (order.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  return (
    <aside className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-gray-950">Manage order</h2>
      <div className="space-y-1.5">
        <FieldLabel>Status</FieldLabel>
        <NativeSelect value={order.status} onChange={handleStatusChange}>
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
        placeholder="0"
        defaultValue={order.depositPaid === 0 ? "" : order.depositPaid}
        onBlur={(event) =>
          updateOrder.mutate({ depositPaid: Number(event.target.value) || 0 })
        }
      />

      {/* Financial Breakdown */}
      <div className="space-y-2.5 rounded-xl bg-gray-50 p-4 text-xs sm:text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Items Subtotal</span>
          <span>{formatCurrency(itemsSubtotal)}</span>
        </div>

        {order.deliveryFee && order.deliveryFee > 0 ? (
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
        ) : null}

        {order.discount?.amount && order.discount.amount > 0 ? (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Discount ({order.discount.code})</span>
            <span>-{formatCurrency(order.discount.amount)}</span>
          </div>
        ) : null}

        <div className="flex justify-between pt-2 border-t border-gray-200/80 font-bold text-gray-950 text-sm sm:text-base">
          <span>Total</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>

        <div className="flex justify-between text-emerald-800 font-medium">
          <span>Deposit Paid</span>
          <span>{formatCurrency(order.depositPaid)}</span>
        </div>

        <div className="flex justify-between pt-1 border-t border-gray-100">
          <span className="font-semibold text-gray-700">Balance Owed</span>
          <strong className={order.balanceOwed > 0 ? "text-amber-700 font-bold" : "text-gray-900"}>
            {formatCurrency(order.balanceOwed)}
          </strong>
        </div>

        <div className="flex justify-between text-stone-500 pt-1 text-[11px]">
          <span>WhatsApp sent</span>
          <span className="font-medium text-gray-900">{order.whatsappSent ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Order Notes</FieldLabel>
        <TextArea
          defaultValue={order.notes ?? ""}
          placeholder="Measurements, customer preferences, or delivery instructions..."
          onBlur={(event) => updateOrder.mutate({ notes: event.target.value })}
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-950 mb-3">Send Updates</h3>
        <div className="space-y-2">
          <a
            href={
              order.whatsappLinks?.confirmed ||
              buildWhatsAppLink(
                order.customerSnapshot.phone,
                buildOrderMessage(order),
              )
            }
            target="_blank"
            rel="noreferrer"
            onClick={() => updateOrder.mutate({ whatsappSent: true })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
            Order Confirmed
          </a>
          <a
            href={
              order.whatsappLinks?.dispatched ||
              buildWhatsAppLink(
                order.customerSnapshot.phone,
                "Your order has been dispatched!",
              )
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
            Order Dispatched
          </a>
          <a
            href={
              order.whatsappLinks?.completed ||
              buildWhatsAppLink(
                order.customerSnapshot.phone,
                "Thank you for shopping with us!",
              )
            }
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

function buildOrderMessage(order: Order) {
  const lines = (order.items || [])
    .map(
      (item) =>
        `${item.productName} (${item.variantLabel}) x ${item.quantity} - ${formatCurrency(item.price * item.quantity)}`,
    )
    .join("\n");
  const deliveryLine = order.deliveryAddress?.street
    ? `\nDelivery: ${order.deliveryAddress.street}, ${order.deliveryAddress.city || ""}`
    : "";
  return [
    `Hi ${order.customerSnapshot.name}, your Vendra order is confirmed.`,
    "",
    lines,
    deliveryLine,
    "",
    `Total: ${formatCurrency(order.totalAmount)}`,
    `Deposit: ${formatCurrency(order.depositPaid)}`,
    `Balance: ${formatCurrency(order.balanceOwed)}`,
  ].filter(Boolean).join("\n");
}
