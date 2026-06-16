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

import { PaginationControls } from "@/components/ui/PaginationControls";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const customers = useCustomers({ page, limit: 10, search });
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
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 mb-4">
            {customers.data.customers.map((customer) => (
              <CustomerCard
                key={customer._id}
                customer={customer}
                onDelete={() => {
                  if (confirm(`Delete ${customer.name}?`)) deleteCustomer.mutate(customer._id);
                }}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
                          {customer.tags.slice(0, 3).map((tag: string) => (
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
          </div>
          
          {customers.data?.pagination && (
            <PaginationControls
              currentPage={customers.data.pagination.page}
              totalPages={customers.data.pagination.totalPages}
              hasNextPage={customers.data.pagination.hasNextPage}
              hasPrevPage={customers.data.pagination.hasPrevPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
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

function CustomerCard({ customer, onDelete }: { customer: any; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/dashboard/customers/${customer._id}`} className="font-semibold text-gray-900 text-base block hover:underline">
            {customer.name}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
          {customer.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{tag}</span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center py-3 border-y border-gray-50 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Orders</p>
          <p className="font-medium text-gray-900">{customer.orderCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5 text-center">LTV</p>
          <p className="font-medium text-gray-900 text-center">{formatCurrency(customer.ltv)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5 text-right">Last Order</p>
          <p className="font-medium text-gray-900 text-right">{customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "None"}</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <a
          href={buildWhatsAppLink(customer.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex h-10 items-center justify-center gap-2 rounded-md border border-[#25D366] bg-[#25D366] text-white hover:bg-[#20bd5a] font-medium text-sm transition-colors"
        >
          <MessageCircle className="size-4" /> Message
        </a>
        <button
          onClick={onDelete}
          className="flex-shrink-0 flex size-10 items-center justify-center rounded-md border border-gray-200 text-error-600 hover:bg-error-50"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}
