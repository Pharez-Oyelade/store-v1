"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminCard,
  VendorStatusBadge,
  PlanBadge,
  ConfirmModal,
  AdminSkeleton,
  AdminEmptyState,
  AdminTableShell,
  formatNaira,
} from "@/components/admin/AdminPrimitives";
import {
  useAdminVendor,
  useToggleVendorStatus,
  useOverrideSubscription,
  useVendorAuditLog,
} from "@/hooks/useAdmin";
import { format } from "date-fns";

const PLANS = ["free", "stitch", "drape", "atelier", "maison"] as const;

export default function AdminVendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: vendor, isLoading, error } = useAdminVendor(id);
  const { data: auditLog } = useVendorAuditLog(id);
  const toggleStatus = useToggleVendorStatus();
  const overrideSub = useOverrideSubscription();

  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");
  const [suspendModal, setSuspendModal] = useState(false);
  const [activateModal, setActivateModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [subModal, setSubModal] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [subReason, setSubReason] = useState("");

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Vendor Profile" />
        <AdminSkeleton rows={6} />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div>
        <AdminPageHeader title="Vendor Profile" />
        <AdminEmptyState
          title="Vendor not found"
          description="This vendor may have been removed."
        />
      </div>
    );
  }

  const stats = vendor.orderStats ?? {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/vendors"
        className="mb-5 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70"
      >
        <ArrowLeft className="size-3.5 text-white/40" />
        <span className="text-white/40">Back to vendors</span>
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {vendor.logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.logo.url}
              alt={vendor.businessName}
              className="size-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl font-bold text-indigo-400">
              {vendor.businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-white">
              {vendor.businessName}
            </h1>
            <p className="text-sm text-white/40">@{vendor.handle}</p>
            <div className="mt-2 flex items-center gap-2">
              <VendorStatusBadge isActive={vendor.isActive} />
              <PlanBadge plan={vendor.subscriptionPlan ?? "free"} />
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="flex flex-col gap-2 sm:items-end">
          {vendor.isActive ? (
            <button
              onClick={() => setSuspendModal(true)}
              className="rounded-lg bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 ring-1 ring-rose-500/20 transition-colors hover:bg-rose-500/20"
            >
              Suspend Vendor
            </button>
          ) : (
            <button
              onClick={() => setActivateModal(true)}
              className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20 transition-colors hover:bg-emerald-500/20"
            >
              Activate Vendor
            </button>
          )}
          <button
            onClick={() => {
              setNewPlan(vendor.subscriptionPlan ?? "free");
              setSubModal(true);
            }}
            className="rounded-lg bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition-colors hover:bg-indigo-500/20"
          >
            Change Plan
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Revenue",
            value: formatNaira(stats.totalRevenue),
            icon: TrendingUp,
          },
          {
            label: "Total Orders",
            value: stats.totalOrders.toString(),
            icon: ShoppingCart,
          },
          {
            label: "Avg. Order Value",
            value: formatNaira(stats.avgOrderValue),
            icon: Package,
          },
          {
            label: "Products",
            value: (vendor.productCount ?? 0).toString(),
            icon: Store,
          },
        ].map(({ label, value, icon: Icon }) => (
          <AdminCard key={label}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">{label}</p>
              <Icon className="size-4 text-white/20" />
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{value}</p>
          </AdminCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 w-fit">
        {(["overview", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-indigo-500 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "audit" ? "Audit Log" : "Overview"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Business Info */}
          <AdminCard>
            <h2 className="mb-4 text-sm font-semibold text-white/70">
              Business Information
            </h2>
            <dl className="space-y-3">
              {[
                { icon: Phone, label: "Phone", value: vendor.phone },
                { icon: Mail, label: "Email", value: vendor.email ?? "—" },
                {
                  icon: MapPin,
                  label: "Location",
                  value:
                    [vendor.location?.city, vendor.location?.state]
                      .filter(Boolean)
                      .join(", ") || "—",
                },
                {
                  icon: Calendar,
                  label: "Joined",
                  value: format(new Date(vendor.createdAt), "MMMM d, yyyy"),
                },
                {
                  icon: Clock,
                  label: "Sub Status",
                  value: vendor.subscriptionStatus ?? "—",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0 text-white/20" />
                  <span className="text-sm text-white/40">{label}</span>
                  <span className="ml-auto text-sm text-white/70">{value}</span>
                </div>
              ))}
            </dl>
          </AdminCard>

          {/* Subscription */}
          {vendor.subscription && (
            <AdminCard>
              <h2 className="mb-4 text-sm font-semibold text-white/70">
                Subscription Details
              </h2>
              <dl className="space-y-3">
                {[
                  { label: "Plan", value: vendor.subscription.plan },
                  { label: "Status", value: vendor.subscription.status },
                  {
                    label: "Period Start",
                    value: vendor.subscription.currentPeriodStart
                      ? format(
                          new Date(vendor.subscription.currentPeriodStart),
                          "MMM d, yyyy",
                        )
                      : "—",
                  },
                  {
                    label: "Period End",
                    value: vendor.subscription.currentPeriodEnd
                      ? format(
                          new Date(vendor.subscription.currentPeriodEnd),
                          "MMM d, yyyy",
                        )
                      : "—",
                  },
                  {
                    label: "Cancel At End",
                    value: vendor.subscription.cancelAtPeriodEnd ? "Yes" : "No",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-white/40">{label}</span>
                    <span className="text-sm capitalize text-white/70">
                      {value}
                    </span>
                  </div>
                ))}
              </dl>
            </AdminCard>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <AdminTableShell>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Action", "Admin", "Details", "Date"].map((h) => (
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
              {!auditLog || auditLog.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-white/30"
                  >
                    No admin actions recorded yet
                  </td>
                </tr>
              ) : (
                auditLog.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-white/60">{log.adminName}</td>
                    <td className="px-4 py-3 text-xs text-white/30">
                      {log.details.reason
                        ? String(log.details.reason)
                        : JSON.stringify(log.details)}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableShell>
      )}

      {/* Suspend Modal */}
      <ConfirmModal
        open={suspendModal}
        title="Suspend this vendor?"
        danger
        confirmLabel="Suspend"
        onCancel={() => {
          setSuspendModal(false);
          setSuspendReason("");
        }}
        onConfirm={() => {
          toggleStatus.mutate(
            { id, isActive: false, reason: suspendReason },
            {
              onSettled: () => {
                setSuspendModal(false);
                setSuspendReason("");
              },
            },
          );
        }}
      >
        <label className="block text-sm text-white/50">
          Reason (required)
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Explain why this vendor is being suspended…"
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50"
          />
        </label>
      </ConfirmModal>

      {/* Activate Modal */}
      <ConfirmModal
        open={activateModal}
        title="Activate this vendor?"
        confirmLabel="Activate"
        onCancel={() => setActivateModal(false)}
        onConfirm={() => {
          toggleStatus.mutate(
            { id, isActive: true },
            { onSettled: () => setActivateModal(false) },
          );
        }}
      />

      {/* Change Plan Modal */}
      <ConfirmModal
        open={subModal}
        title="Change subscription plan"
        confirmLabel="Apply Change"
        onCancel={() => {
          setSubModal(false);
          setSubReason("");
        }}
        onConfirm={() => {
          overrideSub.mutate(
            { id, plan: newPlan, reason: subReason },
            {
              onSettled: () => {
                setSubModal(false);
                setSubReason("");
              },
            },
          );
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/50">New Plan</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#161B22] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              {PLANS.map((p) => (
                <option key={p} value={p} className="bg-[#161B22]">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-white/50">Reason (optional)</label>
            <input
              type="text"
              value={subReason}
              onChange={(e) => setSubReason(e.target.value)}
              placeholder="e.g. Complimentary upgrade"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}
