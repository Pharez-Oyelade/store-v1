"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, Trash2 } from "lucide-react";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  PageHeader,
  TableShell,
} from "@/components/dashboard/DashboardPrimitives";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { buildWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const customers = useCustomers({ page: 1, limit: 50, search });
  const deleteCustomer = useDeleteCustomer();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Customers"
        description="Track customer value, order history, notes, tags and WhatsApp follow-ups."
      />
      <div className="mb-4 max-w-xl">
        <Input
          placeholder="Search by name or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftElement={<Search className="size-4" />}
        />
      </div>

      {customers.data?.customers.length ? (
        <TableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Lifetime value</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.data.customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/customers/${customer._id}`} className="font-medium text-gray-950">
                      {customer.name}
                    </Link>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-3">{customer.orderCount}</td>
                  <td className="px-4 py-3">{formatCurrency(customer.ltv)}</td>
                  <td className="px-4 py-3 text-gray-500">{customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "No completed orders"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a href={buildWhatsAppLink(customer.phone)} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-50" aria-label="WhatsApp customer">
                        <MessageCircle className="size-4" />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${customer.name}?`)) deleteCustomer.mutate(customer._id);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
                        aria-label="Delete customer"
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
          title="No customers yet"
          description="Customers are created automatically when you record orders."
          href="/dashboard/orders/new"
          actionLabel="Create order"
        />
      )}
    </div>
  );
}
