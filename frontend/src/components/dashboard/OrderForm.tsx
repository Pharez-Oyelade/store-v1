"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, UserPlus, Users } from "lucide-react";
import Button from "@/components/custom/Button";
import Input from "@/components/ui/Input";
import {
  FieldLabel,
  NativeSelect,
  TextArea,
} from "@/components/dashboard/DashboardPrimitives";
import { useCreateOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/utils";
import { OrderSource, ProductStatus, type Product } from "@/types";

interface OrderItemDraft {
  productId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

const blankItem: OrderItemDraft = {
  productId: "",
  productName: "",
  variantLabel: "",
  price: 0,
  quantity: 1,
};

export default function OrderForm() {
  const router = useRouter();
  const createOrder = useCreateOrder();
  const products = useProducts({
    page: 1,
    limit: 100,
    status: ProductStatus.Active,
  });
  const customers = useCustomers({ page: 1, limit: 200 });
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [depositPaid, setDepositPaid] = useState(0);
  const [source, setSource] = useState<OrderSource>(OrderSource.DM);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([blankItem]);

  const productList = products.data?.products ?? [];
  const customerList = customers.data?.customers ?? [];
  const isExistingCustomer = selectedCustomerId !== "";

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      ),
    [items],
  );
  const balance = Math.max(0, total - depositPaid);

  function handleCustomerSelect(customerId: string) {
    setSelectedCustomerId(customerId);
    if (customerId === "") {
      // "New customer" selected — clear all fields for manual entry
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      return;
    }
    const customer = customerList.find((c) => c._id === customerId);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email ?? "");
    }
  }

  function updateItem(index: number, next: Partial<OrderItemDraft>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...next } : item)),
    );
  }

  function selectProduct(index: number, productId: string) {
    const product = productList.find((item) => item._id === productId);
    if (!product) {
      updateItem(index, {
        productId: "",
        productName: "",
        variantLabel: "",
        price: 0,
      });
      return;
    }
    const variant = product.variants[0];
    updateItem(index, {
      productId: product._id,
      productName: product.name,
      variantLabel: variant?.label ?? "",
      price: variant?.price ?? product.basePrice,
    });
  }

  function selectVariant(
    index: number,
    product: Product | undefined,
    variantLabel: string,
  ) {
    const variant = product?.variants.find(
      (item) => item.label === variantLabel,
    );
    updateItem(index, { variantLabel, price: variant?.price ?? 0 });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createOrder.mutateAsync({
      customerName,
      customerPhone,
      customerEmail,
      depositPaid,
      source,
      notes,
      items,
    });
    router.push("/dashboard/orders");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"
    >
      <section className="space-y-5 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
        {/* ── Customer selector ──────────────────────────────────── */}
        <div className="space-y-1.5">
          <FieldLabel>Customer</FieldLabel>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {isExistingCustomer ? (
                <Users className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
            </div>
            <NativeSelect
              value={selectedCustomerId}
              onChange={(event) => handleCustomerSelect(event.target.value)}
              className="pl-10"
            >
              <option value="">＋ New customer</option>
              {customerList.length > 0 && (
                <optgroup label="Existing customers">
                  {customerList.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </optgroup>
              )}
            </NativeSelect>
          </div>
          {isExistingCustomer && (
            <p className="text-xs text-brand-600">Customer details filled</p>
          )}
        </div>

        {/* ── Customer details ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Customer name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            required
            readOnly={isExistingCustomer}
            className={
              isExistingCustomer ? "bg-gray-50 cursor-not-allowed" : ""
            }
          />
          <Input
            label="Phone / WhatsApp"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            required
            readOnly={isExistingCustomer}
            className={
              isExistingCustomer ? "bg-gray-50 cursor-not-allowed" : ""
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            readOnly={isExistingCustomer}
            className={
              isExistingCustomer ? "bg-gray-50 cursor-not-allowed" : ""
            }
          />
          <div className="space-y-1.5">
            <FieldLabel>Source</FieldLabel>
            <NativeSelect
              value={source}
              onChange={(event) => setSource(event.target.value as OrderSource)}
            >
              <option value={OrderSource.DM}>Instagram DM</option>
              <option value={OrderSource.Call}>Call</option>
              <option value={OrderSource.WalkIn}>Walk-in</option>
              <option value={OrderSource.Storefront}>Storefront</option>
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Notes</FieldLabel>
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Delivery details, measurements, fabric notes..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950">
                Order items
              </h2>
              <p className="text-sm text-gray-500">
                Select products so stock can deplete when confirmed.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="small"
              leftIcon={<Plus className="size-4" />}
              onClick={() =>
                setItems((current) => [...current, { ...blankItem }])
              }
            >
              Add
            </Button>
          </div>

          {items.map((item, index) => {
            const product = productList.find(
              (entry) => entry._id === item.productId,
            );
            return (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="text-error-600"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Product</FieldLabel>
                    <NativeSelect
                      value={item.productId}
                      onChange={(event) =>
                        selectProduct(index, event.target.value)
                      }
                    >
                      <option value="">Custom item</option>
                      {productList.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  {!item.productId && (
                    <Input
                      label="Custom item name"
                      value={item.productName}
                      onChange={(event) =>
                        updateItem(index, { productName: event.target.value })
                      }
                      required
                    />
                  )}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <FieldLabel>Variant</FieldLabel>
                      {product ? (
                        <NativeSelect
                          value={item.variantLabel}
                          onChange={(event) =>
                            selectVariant(index, product, event.target.value)
                          }
                        >
                          {product.variants.map((variant) => (
                            <option key={variant.label} value={variant.label}>
                              {variant.label} · {variant.quantity} left
                            </option>
                          ))}
                        </NativeSelect>
                      ) : (
                        <Input
                          value={item.variantLabel}
                          onChange={(event) =>
                            updateItem(index, {
                              variantLabel: event.target.value,
                            })
                          }
                          required
                        />
                      )}
                    </div>
                    <Input
                      label="Price"
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(event) =>
                        updateItem(index, { price: Number(event.target.value) })
                      }
                      required
                    />
                    <Input
                      label="Qty"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4 rounded-lg border border-gray-100 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-gray-950">Payment</h2>
        <Input
          label="Deposit paid"
          type="number"
          min={0}
          value={depositPaid}
          onChange={(event) => setDepositPaid(Number(event.target.value))}
        />
        <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-950">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Balance</span>
            <span className="font-semibold text-accent-700">
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
        <Button
          type="submit"
          isLoading={createOrder.isPending}
          leftIcon={<Save className="size-4" />}
          className="w-full"
        >
          Create order
        </Button>
      </aside>
    </form>
  );
}
