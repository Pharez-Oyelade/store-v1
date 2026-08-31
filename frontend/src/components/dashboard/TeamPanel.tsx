"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Scissors,
  ShoppingBag,
  Sparkles,
  MoreVertical,
  Trash2,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Crown,
} from "lucide-react";
import {
  useTeamSummary,
  useInviteTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from "@/hooks/useTeam";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TeamMember, TeamRole } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";

const ROLE_CONFIG: Record<
  TeamRole,
  {
    title: string;
    badgeColor: string;
    icon: typeof ShieldCheck;
    description: string;
    permissions: string[];
  }
> = {
  owner: {
    title: "Store Owner",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200",
    icon: Crown,
    description: "Full store control, billing, subscriptions, bank payouts, and staff management.",
    permissions: ["Full Administrative Access", "Billing & Subscriptions", "Team Invites"],
  },
  manager: {
    title: "Store Manager",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
    icon: ShieldCheck,
    description: "Manages catalog products, orders, bespoke demands, customer CRM, and suppliers.",
    permissions: ["Products & Inventory", "Orders & CRM", "Suppliers & Expenses", "Analytics"],
  },
  tailor: {
    title: "Tailor / Artisan",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200",
    icon: Scissors,
    description: "Views bespoke demands board, client body measurements, and updates production stages.",
    permissions: ["Demands Board", "Body Measurements", "Fitting & Production Stages"],
  },
  sales: {
    title: "Sales Rep / Cashier",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
    icon: ShoppingBag,
    description: "Creates ready-to-wear orders, checks product stock levels, and sends WhatsApp receipts.",
    permissions: ["Ready-to-Wear Orders", "Product Stock Lookup", "WhatsApp Confirmations"],
  },
};

export default function TeamPanel({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: "profile" | "team" | "billing") => void;
}) {
  const { data, isLoading } = useTeamSummary();
  const vendor = useAuthStore((s) => s.vendor);
  const inviteMutation = useInviteTeamMember();
  const deleteMutation = useDeleteTeamMember();


  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Invite Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"manager" | "tailor" | "sales">("manager");
  const [password, setPassword] = useState("");

  const stats = data?.stats;
  const members = data?.members || [];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    inviteMutation.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password: password.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
          setPhone("");
          setPassword("");
          setIsInviteOpen(false);
        },
      }
    );
  };

  const plan = vendor?.subscriptionPlan || "free";
  const isFreeOrStitch = plan === "free" || plan === "stitch";

  return (
    <div className="space-y-6">
      {/* Top Banner & Seats Capacity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
                <Users size={22} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Team Members & Staff Access
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Delegate tasks to workshop tailors, boutique managers, and sales staff with role-based access.
                </p>
              </div>
            </div>
          </div>

          <div>
            {stats?.canInvite ? (
              <button
                onClick={() => setIsInviteOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <UserPlus size={16} />
                <span>Invite Team Member</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab?.("billing")}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <Sparkles size={16} />
                <span>Upgrade for Team Seats</span>
              </button>
            )}
          </div>
        </div>

        {/* Seat Usage Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-xs font-medium text-gray-500">Plan Seat Capacity</p>
            <p className="text-xl font-bold text-gray-900 mt-1 capitalize">
              {stats?.maxSeats === Infinity ? "Unlimited" : `${stats?.maxSeats ?? 1} Seats`}
              <span className="text-xs font-normal text-gray-500 ml-1.5">
                ({plan.toUpperCase()} Plan)
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-xs font-medium text-gray-500">Occupied Seats</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {stats?.totalUsedSeats ?? 1}
              <span className="text-xs font-normal text-gray-500 ml-1.5">
                (1 Owner + {stats?.activeStaffCount ?? 0} Staff)
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-xs font-medium text-gray-500">Available Seats</p>
            <p className="text-xl font-bold text-brand-700 mt-1">
              {stats?.availableSeats === Infinity
                ? "Unlimited"
                : `${stats?.availableSeats ?? 0} Available`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {stats && stats.maxSeats !== Infinity && (
          <div className="mt-4 pt-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
              <span>Seat Allocation</span>
              <span>
                {stats.totalUsedSeats} of {stats.maxSeats} seats used
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stats.totalUsedSeats >= stats.maxSeats ? "bg-amber-500" : "bg-brand-700"
                }`}
                style={{
                  width: `${Math.min(100, (stats.totalUsedSeats / stats.maxSeats) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Banner for Free/Stitch Plans */}
      {isFreeOrStitch && (
        <div className="rounded-2xl border border-purple-200 bg-linear-to-r from-purple-50 via-white to-brand-50 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
              <Sparkles size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-purple-950">
                Unlock Multi-User Team Collaboration
              </h4>
              <p className="text-xs text-purple-800 mt-0.5 max-w-xl leading-relaxed">
                Upgrade to <strong>The Drape Plan (3 seats)</strong> or <strong>The Atelier Plan (10 seats)</strong> to let workshop tailors record measurements and boutique managers process sales without sharing your owner password.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.("billing")}
            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 px-4 py-2.5 rounded-xl shrink-0 transition-colors shadow-xs"
          >
            Upgrade Plan &rarr;
          </button>
        </div>
      )}


      {/* Team Members List */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Workspace Members ({members.length + 1})
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Active Store: {vendor?.businessName}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Primary Owner Row */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/20">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center justify-center text-sm shrink-0">
                {vendor?.businessName?.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {vendor?.businessName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                    <Crown size={10} /> Owner
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {vendor?.email || vendor?.phone} • Primary Account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 italic">Full Administrative Access</span>
            </div>
          </div>

          {/* Invited Staff Members */}
          {members.map((member) => {
            const roleInfo = ROLE_CONFIG[member.role] || ROLE_CONFIG.manager;
            const RoleIcon = roleInfo.icon;

            return (
              <div
                key={member._id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  !member.isActive ? "bg-gray-50/80 opacity-70" : "hover:bg-gray-50/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0 border border-brand-200">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {member.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeColor}`}
                      >
                        <RoleIcon size={10} /> {roleInfo.title}
                      </span>
                      {!member.isActive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {member.email} {member.phone ? `• ${member.phone}` : ""} • Added{" "}
                      {formatDate(member.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center self-end">
                  <button
                    onClick={() => setEditingMember(member)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to remove ${member.name} from your workspace? Their seat will become available immediately.`
                        )
                      ) {
                        deleteMutation.mutate(member._id);
                      }
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove team member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-700">No staff members invited yet</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats?.canInvite
                  ? "Click 'Invite Team Member' to add workshop tailors or boutique managers."
                  : "Upgrade to The Drape Plan to invite staff to your workspace."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role Guide Cards */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          Understanding Workspace Roles & Permissions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["manager", "tailor", "sales"] as const).map((r) => {
            const config = ROLE_CONFIG[r];
            const Icon = config.icon;

            return (
              <div key={r} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border ${config.badgeColor}`}>
                    <Icon size={14} />
                  </span>
                  <p className="text-xs font-bold text-gray-900">{config.title}</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{config.description}</p>
                <div className="pt-2 border-t border-gray-200/60 space-y-1">
                  {config.permissions.map((perm) => (
                    <div key={perm} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <CheckCircle2 size={12} className="text-brand-700 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INVITE MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
                  <UserPlus size={20} />
                </span>
                <h3 className="text-base font-bold text-gray-900">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chukwudi Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Select Role & Permissions *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["manager", "tailor", "sales"] as const).map((r) => {
                    const config = ROLE_CONFIG[r];
                    const Icon = config.icon;
                    const isSelected = role === r;

                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-brand-700 bg-brand-50/60 ring-2 ring-brand-700/20"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={14} className={isSelected ? "text-brand-700" : "text-gray-500"} />
                          <span className="text-xs font-bold text-gray-900">{config.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2">
                          {config.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Set Initial Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate a temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  The staff member can log in using their email and this password.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "Adding..." : "Add to Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}

function EditMemberModal({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const updateMutation = useUpdateTeamMember(member._id);
  const [role, setRole] = useState<"manager" | "tailor" | "sales">(
    (member.role as any) || "manager"
  );
  const [isActive, setIsActive] = useState(member.isActive);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        role,
        isActive,
        password: newPassword.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Manage {member.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Workspace Role
            </label>
            <div className="space-y-2">
              {(["manager", "tailor", "sales"] as const).map((r) => {
                const config = ROLE_CONFIG[r];
                const isSelected = role === r;

                return (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand-700 bg-brand-50/60"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{config.title}</p>
                      <p className="text-[11px] text-gray-500">{config.description}</p>
                    </div>
                    <input
                      type="radio"
                      name="edit-role"
                      value={r}
                      checked={isSelected}
                      onChange={() => setRole(r)}
                      className="text-brand-700"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Account Status</p>
                <p className="text-[11px] text-gray-500">
                  {isActive ? "Active (Can log into workspace)" : "Deactivated (Access blocked)"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 text-brand-700 rounded"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Reset Password (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter new password to reset"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
