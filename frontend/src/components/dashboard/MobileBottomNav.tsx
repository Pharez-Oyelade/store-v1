"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PackagePlus,
  Users,
  Menu,
  X,
  Plus,
  FileText,
  Scissors,
  Handshake,
  BarChart3,
  Store,
  Settings,
  LogOut,
  Cloud,
  WifiOff,
  RefreshCw,
  Download,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNetworkStore } from "@/store/networkStore";
import { useLogout } from "@/hooks/useAuth";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { isPathAllowedForRole } from "@/lib/rbac";
import { NAV_ITEMS } from "./DashboardSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const vendor = useAuthStore((s) => s.vendor);
  const { mutate: logout } = useLogout();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // State for both sheets
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOnline = useNetworkStore((s) => s.isOnline);
  const isSyncing = useNetworkStore((s) => s.isSyncing);
  const pendingCount = useNetworkStore((s) => s.pendingCount);
  const setDrawerOpen = useNetworkStore((s) => s.setDrawerOpen);

  const userRole = (vendor?.user?.role || vendor?.role || "owner") as string;
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    isPathAllowedForRole(item.href, userRole),
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Primary tabs (2 left of Center Action, 2 right)
  const leftTabs = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  ].filter((tab) => isPathAllowedForRole(tab.href, userRole));

  const rightTabs = [
    { label: "Products", href: "/dashboard/products", icon: Package },
  ].filter((tab) => isPathAllowedForRole(tab.href, userRole));

  // Tabs relegated to the "More" Drawer
  const excludedFromMore = ["/dashboard", "/dashboard/orders", "/dashboard/products"];
  const moreTabs = visibleNavItems.filter(
    (item) => !excludedFromMore.includes(item.href),
  );

  // Check if any route in the "More" drawer is active
  const isMoreActive = moreTabs.some((item) => isActive(item.href));

  // Quick Create actions available to user
  const allQuickCreateActions = [
    {
      title: "New Order",
      subtitle: "Record a direct POS sale or customer order",
      href: "/dashboard/orders/new",
      parentHref: "/dashboard/orders",
      icon: ShoppingCart,
      badge: "Quick Sale",
      theme: "brand",
    },
    {
      title: "Add Product",
      subtitle: "Upload new inventory, variants, colors & pricing",
      href: "/dashboard/products/new",
      parentHref: "/dashboard/products",
      icon: PackagePlus,
      badge: "Inventory",
      theme: "emerald",
    },
    {
      title: "Create Invoice",
      subtitle: "Bill a customer with instant bank/online payment link",
      href: "/dashboard/invoices/new",
      parentHref: "/dashboard/invoices",
      icon: FileText,
      badge: "Billing",
      theme: "blue",
    },
    {
      title: "Custom Request",
      subtitle: "Record custom tailoring demand & measurements",
      href: "/dashboard/demands/new",
      parentHref: "/dashboard/demands",
      icon: Scissors,
      badge: "Tailoring",
      theme: "amber",
    },
  ];

  const permittedQuickCreate = allQuickCreateActions.filter((action) =>
    isPathAllowedForRole(action.parentHref, userRole),
  );

  const getItemSubtitle = (label: string) => {
    switch (label) {
      case "Customers":
        return "Buyer directory & transaction history";
      case "Invoices":
        return "Billing & payment proofs";
      case "Demands":
        return "Custom tailoring requests";
      case "Suppliers":
        return "Vendors & inventory source";
      case "Analytics":
        return "Sales performance & revenue";
      case "Storefront":
        return "Online shop & public catalog";
      case "Settings":
        return "Store profile, bank, staff";
      default:
        return "";
    }
  };

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar with Center Action (Option A) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] select-none"
        style={{
          backgroundColor: "#ffffff",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {/* Left Tabs (Overview, Orders) */}
          {leftTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all active:scale-95 group",
                  active ? "text-brand-600" : "text-gray-500 hover:text-gray-900",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-7 rounded-xl transition-all",
                    active && "bg-brand-50 text-brand-600 font-semibold",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      active ? "text-brand-600 scale-105" : "text-gray-500 group-hover:text-gray-900",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 tracking-tight",
                    active ? "text-brand-600 font-bold" : "text-gray-500 font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* ── Center Quick-Action "+" Button (Opens Quick Create Sheet) ── */}
          <div className="flex items-center justify-center flex-1">
            <Sheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-11 h-11 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-all cursor-pointer",
                    quickCreateOpen && "rotate-45 bg-gray-900 shadow-gray-900/30",
                  )}
                  aria-label="Create new item"
                >
                  <Plus className="w-6 h-6 stroke-[2.5] text-white" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="bottom"
                showCloseButton={false}
                className="p-0 border-t border-gray-200 bg-white text-gray-900 rounded-t-[28px] overflow-hidden shadow-2xl focus:outline-none"
                style={{
                  backgroundColor: "#ffffff",
                  maxHeight: "85vh",
                }}
              >
                {/* Visual Pull Handle */}
                <div className="pt-3 pb-1 flex justify-center shrink-0">
                  <div className="w-12 h-1.5 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2.5 shrink-0 border-b border-gray-100">
                  <SheetHeader className="p-0 space-y-0 text-left">
                    <SheetTitle className="text-base font-bold text-gray-900">
                      Quick Create
                    </SheetTitle>
                  </SheetHeader>
                  <button
                    type="button"
                    onClick={() => setQuickCreateOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
                    aria-label="Close creation menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Action Cards */}
                <div
                  className="p-4 space-y-2.5 overflow-y-auto"
                  style={{
                    maxHeight: "calc(85vh - 70px)",
                    paddingBottom: "max(env(safe-area-inset-bottom, 16px), 24px)",
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">
                    What would you like to create?
                  </p>

                  {permittedQuickCreate.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        prefetch={true}
                        onClick={() => setQuickCreateOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/70 hover:bg-white hover:border-brand-300 hover:shadow-xs active:scale-[0.98] transition-all group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={cn(
                              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-colors",
                              action.theme === "brand" &&
                                "bg-brand-50 border-brand-200/80 text-brand-600 group-hover:bg-brand-600 group-hover:text-white",
                              action.theme === "emerald" &&
                                "bg-emerald-50 border-emerald-200/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                              action.theme === "blue" &&
                                "bg-blue-50 border-blue-200/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                              action.theme === "amber" &&
                                "bg-amber-50 border-amber-200/80 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
                            )}
                          >
                            <ActionIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                                {action.title}
                              </p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200/60">
                                {action.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {action.subtitle}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Tab (Products) */}
          {rightTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all active:scale-95 group",
                  active ? "text-brand-600" : "text-gray-500 hover:text-gray-900",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-7 rounded-xl transition-all",
                    active && "bg-brand-50 text-brand-600 font-semibold",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      active ? "text-brand-600 scale-105" : "text-gray-500 group-hover:text-gray-900",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 tracking-tight",
                    active ? "text-brand-600 font-bold" : "text-gray-500 font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More / Menu Drawer Trigger */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all active:scale-95 group cursor-pointer",
                  menuOpen || isMoreActive
                    ? "text-brand-600"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-7 rounded-xl transition-all relative",
                    (menuOpen || isMoreActive) && "bg-brand-50 text-brand-600",
                  )}
                >
                  <Menu
                    className={cn(
                      "w-5 h-5",
                      menuOpen || isMoreActive
                        ? "text-brand-600"
                        : "text-gray-500 group-hover:text-gray-900",
                    )}
                  />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 tracking-tight",
                    menuOpen || isMoreActive
                      ? "text-brand-600 font-bold"
                      : "text-gray-500 font-medium",
                  )}
                >
                  Menu
                </span>
              </button>
            </SheetTrigger>

            {/* ── "More" Bottom Sheet Drawer (Clean Light Theme) ── */}
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="p-0 border-t border-gray-200 bg-white text-gray-900 rounded-t-[28px] overflow-hidden shadow-2xl focus:outline-none"
              style={{
                backgroundColor: "#ffffff",
                maxHeight: "88vh",
              }}
            >
              {/* Visual Pull Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-gray-300" />
              </div>

              {/* Drawer Top Header Bar */}
              <div className="flex items-center justify-between px-5 py-2.5 shrink-0 border-b border-gray-100">
                <SheetHeader className="p-0 space-y-0 text-left">
                  <SheetTitle className="text-base font-bold text-gray-900">
                    Dashboard Menu
                  </SheetTitle>
                </SheetHeader>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                className="overflow-y-auto px-4 py-3.5 space-y-4"
                style={{
                  maxHeight: "calc(88vh - 70px)",
                  paddingBottom: "max(env(safe-area-inset-bottom, 16px), 28px)",
                }}
              >
                {/* Store & Vendor Identity Card */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative shrink-0 self-center"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <div
                        className="w-12 h-12 rounded-full bg-brand-600 border border-brand-700/20 flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0 aspect-square select-none"
                        style={{
                          width: "48px",
                          height: "48px",
                          minWidth: "48px",
                          minHeight: "48px",
                        }}
                      >
                        {vendor
                          ? getInitials(vendor.user?.name || vendor.businessName)
                          : "V"}
                      </div>
                      {!isOnline ? (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-white"
                          title="Offline"
                        />
                      ) : isSyncing ? (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-white animate-pulse"
                          title="Syncing"
                        />
                      ) : pendingCount > 0 ? (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-orange-500 ring-2 ring-white"
                          title="Pending updates"
                        />
                      ) : (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {vendor?.user?.name || vendor?.businessName || "Vendor"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {vendor?.user?.email || vendor?.email || vendor?.phone || "Store Owner"}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                          {vendor?.subscriptionPlan || vendor?.subscription?.plan || "Free"} Plan
                        </span>
                        {!isOnline ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <WifiOff className="w-3 h-3" /> Offline
                          </span>
                        ) : isSyncing ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Free Plan Upgrade Banner */}
                  {!vendor?.user?.isTeamMember &&
                    (!vendor?.subscriptionPlan || vendor.subscriptionPlan === "free") &&
                    vendor?.role !== "admin" && (
                      <div className="mt-3 pt-3 border-t border-gray-200/80 flex items-center justify-between">
                        <p className="text-xs text-gray-600 font-medium">
                          Upgrade for unlimited orders
                        </p>
                        <Link
                          href="/dashboard/settings?tab=billing"
                          onClick={() => setMenuOpen(false)}
                          className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
                        >
                          Upgrade <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                </div>

                {/* Secondary Feature Navigation (Clean List Rows) */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                    Store Management
                  </p>
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-xs">
                    {moreTabs.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      const subtitle = getItemSubtitle(item.label);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between p-3.5 hover:bg-white transition-colors group",
                            active && "bg-brand-50/60",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors border",
                                active
                                  ? "bg-brand-50 border-brand-200 text-brand-600"
                                  : "bg-white border-gray-200/80 text-gray-600 group-hover:text-gray-900 group-hover:border-gray-300",
                              )}
                            >
                              <Icon className="w-5 h-5 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-semibold leading-tight",
                                  active
                                    ? "text-brand-600"
                                    : "text-gray-900 group-hover:text-brand-600 transition-colors",
                                )}
                              >
                                {item.label}
                              </p>
                              {subtitle && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {item.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5",
                                active && "text-brand-600",
                              )}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* System & Utility Actions (Clean List Rows) */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                    System & Actions
                  </p>
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-xs">
                    {/* Sync Center */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDrawerOpen(true);
                      }}
                      className="flex items-center justify-between w-full p-3.5 hover:bg-white transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center shrink-0">
                          {!isOnline ? (
                            <WifiOff className="w-5 h-5 text-amber-500" />
                          ) : isSyncing ? (
                            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                          ) : (
                            <Cloud className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                            Sync Center
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {!isOnline
                              ? "Working offline"
                              : isSyncing
                                ? "Syncing changes..."
                                : pendingCount > 0
                                  ? `${pendingCount} pending updates`
                                  : "All data backed up"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {pendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {pendingCount}
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                        )}
                      </div>
                    </button>

                    {/* Install App */}
                    {isInstallable && !isInstalled && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          promptInstall();
                        }}
                        className="flex items-center justify-between w-full p-3.5 hover:bg-white transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
                            <Download className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                              Install Vendra App
                            </p>
                            <p className="text-xs text-emerald-600 truncate">
                              Add to home screen for offline use
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-3" />
                      </button>
                    )}

                    {/* Admin Console */}
                    {vendor?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between w-full p-3.5 hover:bg-white transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600 font-bold">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                              Admin Console
                            </p>
                            <p className="text-xs text-indigo-600 truncate">
                              System-wide platform controls
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-3" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="mt-4 w-full p-3 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
