import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { AnnouncementType } from "@/types";

/* ─── KPI Card ────────────────────────────────────────────────── */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendLabel,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: number | null; // positive = up, negative = down, null = no data
  trendLabel?: string;
  tone?: "indigo" | "green" | "amber" | "rose" | "slate";
}) {
  const iconBg: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-400",
    green: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    rose: "bg-rose-500/15 text-rose-400",
    slate: "bg-white/10 text-white/60",
  };

  const isUp = trend !== null && trend !== undefined && trend >= 0;
  const hasNoTrend = trend === null || trend === undefined;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#161B22] p-5 transition-colors hover:bg-[#1C2128]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white/50">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconBg[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-1.5">
        {!hasNoTrend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isUp ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {isUp ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(trend!)}%
          </span>
        )}
        {sub && (
          <span className="text-xs text-white/30">{sub}</span>
        )}
        {trendLabel && (
          <span className="text-xs text-white/30">{trendLabel}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Admin Page Header ───────────────────────────────────────── */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-white/40">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ─── Vendor Status Badge ─────────────────────────────────────── */
export function VendorStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-400" : "bg-rose-400",
        )}
      />
      {isActive ? "Active" : "Suspended"}
    </span>
  );
}

/* ─── Plan Badge ──────────────────────────────────────────────── */
const planStyles: Record<string, string> = {
  free: "bg-white/5 text-white/50 ring-white/10",
  stitch: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
  drape: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  atelier: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  maison: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
};

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1",
        planStyles[plan] ?? planStyles.free,
      )}
    >
      {plan}
    </span>
  );
}

/* ─── Announcement Type Badge ─────────────────────────────────── */
const announcementStyles: Record<AnnouncementType, string> = {
  info: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  urgent: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
};

export function AnnouncementTypeBadge({ type }: { type: AnnouncementType }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1",
        announcementStyles[type],
      )}
    >
      {type}
    </span>
  );
}

/* ─── Admin Table Shell ───────────────────────────────────────── */
export function AdminTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#161B22]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/* ─── Admin Stat Card (simple) ────────────────────────────────── */
export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-[#161B22] p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Admin Empty State ───────────────────────────────────────── */
export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
      <p className="text-sm font-medium text-white/50">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-white/30">{description}</p>
      )}
    </div>
  );
}

/* ─── Confirmation Modal ──────────────────────────────────────── */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161B22] p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {message && (
          <p className="mt-2 text-sm text-white/50">{message}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
              danger
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-indigo-500 hover:bg-indigo-600",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Loading Skeleton ──────────────────────────────────── */
export function AdminSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-white/5"
        />
      ))}
    </div>
  );
}

/* ─── Format helpers ──────────────────────────────────────────── */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[(month - 1) % 12]} ${year}`;
}
