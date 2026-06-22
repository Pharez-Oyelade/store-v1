"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminTableShell,
  VendorStatusBadge,
  PlanBadge,
  AdminEmptyState,
  AdminSkeleton,
  formatNaira,
} from "@/components/admin/AdminPrimitives";
import { useAdminVendors } from "@/hooks/useAdmin";
import type { AdminVendorQueryParams, SubscriptionPlan } from "@/types";
import { format } from "date-fns";

const PLAN_FILTERS = [
  "all",
  "free",
  "stitch",
  "drape",
  "atelier",
  "maison",
] as const;
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const;

export default function AdminVendorsPage() {
  const [params, setParams] = useState<AdminVendorQueryParams>({
    page: 1,
    limit: 20,
    status: "all",
    plan: "all",
    search: "",
    sort: "newest",
  });
  const [searchInput, setSearchInput] = useState("");

  /* Debounced search effect */
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams((p) => {
        if (p.search === searchInput) return p;
        return { ...p, search: searchInput, page: 1 };
      });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading } = useAdminVendors(params);

  const vendors = data?.vendors ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <AdminPageHeader
        title="Vendor Directory"
        description="Manage all vendors on the Vendra platform"
      />

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, handle, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                setParams((p) => ({
                  ...p,
                  status: value as AdminVendorQueryParams["status"],
                  page: 1,
                }))
              }
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                params.status === value
                  ? "bg-indigo-500 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Plan filter */}
        <select
          value={params.plan}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              plan: e.target.value as SubscriptionPlan | "all",
              page: 1,
            }))
          }
          className="h-10 rounded-lg border border-white/10 bg-[#161B22] px-3 text-sm text-white/70 outline-none focus:border-indigo-500/50"
        >
          {PLAN_FILTERS.map((p) => (
            <option key={p} value={p} className="bg-[#161B22]">
              {p === "all"
                ? "All Plans"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <AdminTableShell>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {[
                "Vendor",
                "Phone",
                "Plan",
                "Status",
                "Products",
                "Orders",
                "Revenue",
                "Joined",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8">
                  <AdminSkeleton rows={5} />
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12">
                  <AdminEmptyState
                    title="No vendors found"
                    description="Try adjusting your search or filters"
                  />
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr
                  key={vendor._id}
                  className="group transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {vendor.logo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vendor.logo.url}
                          alt={vendor.businessName}
                          className="size-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-400">
                          {vendor.businessName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-white/90 hover:text-indigo-400 transition-colors">
                        <Link
                          href={`/admin/vendors/${vendor._id}`}
                          className="font-medium text-white/90 hover:text-indigo-400 transition-colors"
                        >
                          {vendor.businessName}
                        </Link>
                        <p className="text-xs text-white/30">
                          @{vendor.handle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50">{vendor.phone}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={vendor.subscriptionPlan ?? "free"} />
                  </td>
                  <td className="px-4 py-3">
                    <VendorStatusBadge isActive={vendor.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right text-white/50">
                    {vendor.productCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-white/50">
                    {vendor.orderCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white/70">
                    {formatNaira(vendor.totalRevenue ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    {format(new Date(vendor.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/vendors/${vendor._id}`}
                      className="flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      View
                      <ExternalLink className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-white/40">
          <span>
            {pagination.total} vendors · Page {pagination.page} of{" "}
            {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() =>
                setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
              }
              className="flex size-8 items-center justify-center rounded-lg border border-white/10 transition-colors hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() =>
                setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
              }
              className="flex size-8 items-center justify-center rounded-lg border border-white/10 transition-colors hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
