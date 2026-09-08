"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Handshake,
  BarChart3,
  Store,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Scissors,
  ArrowRight,
  Download,
  FileText,
  Cloud,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNetworkStore } from "@/store/networkStore";
import { getInitials } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import Logo from "../brand/Logo";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Demands", href: "/dashboard/demands", icon: Scissors },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Handshake },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  {
    label: "Storefront",
    href: "/dashboard/storefront",
    icon: Store,
    badge: "Soon",
  },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

import { isPathAllowedForRole, getRoleHomePath } from "@/lib/rbac";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const vendor = useAuthStore((s) => s.vendor);
  const { mutate: logout } = useLogout();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-warm dashboard workstations, creation forms, and RSC streams when online
  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== "undefined" && navigator.onLine) {
      const coreRoutes = [
        "/dashboard",
        "/dashboard/products",
        "/dashboard/products/new",
        "/dashboard/orders",
        "/dashboard/orders/new",
        "/dashboard/demands",
        "/dashboard/demands/new",
        "/dashboard/customers",
        "/dashboard/invoices",
        "/dashboard/invoices/new",
        "/dashboard/suppliers",
      ];

      // 1. Next.js App Router prefetch (downloads client JS chunks and RSC payloads)
      coreRoutes.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {}
      });

      // 2. Pre-cache HTML documents and canonical RSC streams in Service Worker cache (v5)
      if ("caches" in window) {
        caches
          .open("vendra-cache-v5")
          .then((cache) => {
            coreRoutes.forEach(async (route) => {
              try {
                // Pre-cache full HTML document for reload (F5)
                const res = await fetch(route, {
                  credentials: "same-origin",
                  cache: "no-cache",
                });
                if (res.ok) {
                  const htmlText = await res.text();
                  const htmlHeaders = {
                    "Content-Type": res.headers.get("Content-Type") || "text/html; charset=utf-8",
                  };
                  await cache.put(route, new Response(htmlText, { headers: htmlHeaders }));
                  await cache.put(window.location.origin + route, new Response(htmlText, { headers: htmlHeaders }));

                  // Discover and pre-cache static script chunks referenced in the page HTML
                  const chunkMatches = htmlText.match(/\/_next\/static\/chunks\/[a-zA-Z0-9_\-\.\/]+\.js/g);
                  if (chunkMatches) {
                    chunkMatches.forEach(async (chunkPath) => {
                      try {
                        const chunkRes = await fetch(chunkPath, { cache: "no-cache" });
                        if (chunkRes.ok) {
                          await cache.put(chunkPath, chunkRes.clone());
                          await cache.put(window.location.origin + chunkPath, chunkRes);
                        }
                      } catch {}
                    });
                  }
                }

                // Pre-cache RSC payload for seamless offline client-side link transitions
                const rscRes = await fetch(`${route}?_rsc=prewarm`, {
                  headers: { RSC: "1" },
                  credentials: "same-origin",
                });
                if (rscRes.ok) {
                  const rscText = await rscRes.text();
                  const rscHeaders = {
                    "Content-Type": rscRes.headers.get("Content-Type") || "text/x-component",
                  };
                  await cache.put(
                    window.location.origin + route + "__rsc__",
                    new Response(rscText, { headers: rscHeaders }),
                  );

                  // Also discover any chunk URLs listed inside the RSC text stream
                  const rscChunks = rscText.match(/static\/chunks\/[a-zA-Z0-9_\-\.\/]+\.js/g);
                  if (rscChunks) {
                    rscChunks.forEach(async (relPath) => {
                      try {
                        const chunkUrl = `/_next/${relPath}`;
                        const cRes = await fetch(chunkUrl, { cache: "no-cache" });
                        if (cRes.ok) {
                          await cache.put(chunkUrl, cRes.clone());
                          await cache.put(window.location.origin + chunkUrl, cRes);
                        }
                      } catch {}
                    });
                  }
                }
              } catch {}
            });
          })
          .catch(() => {});
      }
    }
  }, [mounted, router]);

  const isOnline = useNetworkStore((s) => s.isOnline);
  const isSyncing = useNetworkStore((s) => s.isSyncing);
  const pendingCount = useNetworkStore((s) => s.pendingCount);
  const setDrawerOpen = useNetworkStore((s) => s.setDrawerOpen);

  const isOnlineEffective = mounted ? isOnline : true;
  const isSyncingEffective = mounted ? isSyncing : false;
  const pendingCountEffective = mounted ? pendingCount : 0;

  const userRole = (vendor?.user?.role || vendor?.role || "owner") as string;
  const roleHomePath = getRoleHomePath(userRole);
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    isPathAllowedForRole(item.href, userRole),
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-white/10 shrink-0 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href={roleHomePath} className="flex items-center">
          {collapsed ? (
            <Logo variant="icon" size={32} theme="dark" />
          ) : (
            <Logo size="md" theme="dark" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-500/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-0",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0 text-white" />
                {!collapsed && <span className="text-white">{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Vendor Info + Logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {vendor
              ? getInitials(vendor.user?.name || vendor.businessName)
              : "V"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {vendor?.user?.name || vendor?.businessName || "Vendor"}
              </p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {vendor?.user?.isTeamMember
                  ? `${vendor.user.role} • ${vendor.businessName}`
                  : `${vendor?.subscriptionPlan || vendor?.subscription?.plan || "free"} plan`}
              </p>
            </div>
          )}
        </div>

        {!vendor?.user?.isTeamMember &&
          (!vendor?.subscriptionPlan || vendor.subscriptionPlan === "free") &&
          vendor?.role !== "admin" &&
          !collapsed && (
            <div className="mt-3 mb-1 px-3 py-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <p className="text-xs text-brand-200 font-medium mb-2">
                You are on the Free plan. Upgrade to unlock more features.
              </p>
              <Link
                href="/dashboard/settings?tab=billing"
                className="block text-center text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 py-1.5 px-3 rounded-md transition-colors"
              >
                <div className="text-white text-center justify-center flex gap-2 items-center">
                  Upgrade Now <ArrowRight />
                </div>
              </Link>
            </div>
          )}

        {vendor?.role === "admin" && !collapsed && (
          <div className="mt-3 mb-1 px-3 py-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
              Admin Mode
            </p>
            <Link
              href="/admin"
              className="block text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 px-3 rounded-lg transition-colors shadow-xs"
            >
              Open Admin Panel &rarr;
            </Link>
          </div>
        )}

        {/* Offline Sync Trigger / Status */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 mt-1 rounded-lg text-sm font-medium transition-colors cursor-pointer",
            !isOnlineEffective
              ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              : pendingCountEffective > 0
                ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                : "text-gray-400 hover:text-gray-300 hover:bg-white/5",
            collapsed && "justify-center px-0",
          )}
          title="Offline Sync Center"
        >
          {!isOnlineEffective ? (
            <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
          ) : isSyncingEffective ? (
            <RefreshCw className="w-5 h-5 shrink-0 animate-spin text-blue-400" />
          ) : (
            <Cloud className="w-5 h-5 shrink-0" />
          )}
          {!collapsed && (
            <span className="flex items-center justify-between flex-1">
              <span>Sync Center</span>
              {pendingCountEffective > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  {pendingCountEffective}
                </span>
              )}
            </span>
          )}
        </button>

        {isInstallable && !isInstalled && (
          <button
            onClick={() => promptInstall()}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 mt-1 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors",
              collapsed && "justify-center px-0",
            )}
            title="Install App"
          >
            <Download className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Install App</span>}
          </button>
        )}

        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 mt-1 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-white/10 text-gray-500 hover:text-white transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-sidebar text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface-sidebar transform transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block h-screen bg-surface-sidebar shrink-0 transition-all duration-300 sticky top-0",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
