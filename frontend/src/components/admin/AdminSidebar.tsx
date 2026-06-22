"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  BarChart3,
  Megaphone,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentVendor, useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Vendors", href: "/admin/vendors", icon: Store },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const vendor = useCurrentVendor();
  const clearVendor = useAuthStore((s) => s.clearVendor);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore errors — clear state regardless */
    }
    clearVendor();
    router.replace("/login");
    toast.success("Logged out");
  }

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col bg-[#0D1117] text-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5 shrink-0">
        <div className="flex size-8 items-center justify-center rounded-md bg-indigo-500">
          <ShieldCheck className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white">
            Vendra Admin
          </p>
          <p className="mt-0.5 text-[10px] text-white/40 uppercase tracking-wider">
            Control Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-indigo-400" : "text-white/40 group-hover:text-white/60",
                )}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight className="size-3 text-indigo-400 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: admin info + logout */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="mb-2 rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-xs font-medium text-white/80">
            {vendor?.businessName ?? "Admin"}
          </p>
          <p className="mt-0.5 text-[10px] text-white/40">
            {vendor?.phone}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 rounded-lg bg-[#161B22] border border-white/10 p-2 text-white/70 shadow-lg backdrop-blur-md transition-colors hover:text-white hover:bg-white/5"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1117] shadow-2xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 z-50 rounded bg-white/5 p-1 text-white/50 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block h-screen w-64 shrink-0 bg-[#0D1117] sticky top-0 border-r border-white/10">
        {sidebarContent}
      </aside>
    </>
  );
}

