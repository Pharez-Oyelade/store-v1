import Link from "next/link";
import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "green" | "amber" | "blue" | "rose" | "slate";
}) {
  const tones = {
    green: "bg-brand-50 text-brand-700",
    amber: "bg-accent-50 text-accent-700",
    blue: "bg-info-50 text-info-600",
    rose: "bg-error-50 text-error-600",
    slate: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">{value}</p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.replace("_", " ");
  const tone =
    value === "completed" || value === "active" || value === "preferred"
      ? "bg-brand-50 text-brand-700 ring-brand-200"
      : value === "pending" || value === "draft" || value === "ready"
        ? "bg-accent-50 text-accent-700 ring-accent-200"
        : value === "cancelled" || value === "archived" || value === "inactive"
          ? "bg-error-50 text-error-600 ring-error-200"
          : "bg-info-50 text-info-600 ring-info-200";

  return (
    <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1", tone)}>
      {normalized}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{description}</p>
      {href && actionLabel && (
        <Link
          href={href}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-card">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500",
        props.className,
      )}
    />
  );
}

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500",
        props.className,
      )}
    />
  );
}
