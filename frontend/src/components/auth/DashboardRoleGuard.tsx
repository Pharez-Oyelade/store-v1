"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Lock, Home } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { isPathAllowedForRole, getRoleHomePath, getFeatureNameForPath } from "@/lib/rbac";
import toast from "react-hot-toast";

interface DashboardRoleGuardProps {
  children: React.ReactNode;
}

export default function DashboardRoleGuard({ children }: DashboardRoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendor = useAuthStore((s) => s.vendor);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [hasRedirected, setHasRedirected] = useState(false);

  const userRole = (vendor?.user?.role || vendor?.role || "owner") as string;
  const isAllowed = isPathAllowedForRole(pathname, userRole);
  const featureName = getFeatureNameForPath(pathname);
  const homePath = getRoleHomePath(userRole);

  // Notify user if they were redirected here from an unauthorized page via middleware
  useEffect(() => {
    const deniedRole = searchParams.get("unauthorized");
    const fromPath = searchParams.get("from");
    // Only show toast if user attempted to visit a specific forbidden sub-route
    if (deniedRole && (!fromPath || fromPath !== "/dashboard")) {
      toast.error(
        `Access restricted: The '${deniedRole}' role cannot view that section.`,
        { id: "rbac-denied-toast", duration: 5000 }
      );
    }
  }, [searchParams]);

  const isRootDashboard = pathname === "/dashboard";

  // If unauthorized during client-side navigation:
  // 1. Root /dashboard portal: silent instant forward to role workspace home (seamless UX)
  // 2. Specific unauthorized section (e.g. /dashboard/settings): show access barrier & alert toast
  useEffect(() => {
    if (isAuthenticated && !isAllowed && !hasRedirected) {
      setHasRedirected(true);
      if (isRootDashboard) {
        router.replace(homePath);
      } else {
        toast.error(
          `Access restricted: '${userRole}' role cannot access ${featureName}.`,
          { id: "rbac-denied-route", duration: 4000 }
        );
        const timer = setTimeout(() => {
          router.replace(homePath);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, isAllowed, hasRedirected, router, homePath, userRole, featureName, isRootDashboard]);

  // While initializing, don't flash anything
  if (!isInitialized && !vendor) {
    return <>{children}</>;
  }

  // If root /dashboard for a role without overview permission, render null during instant redirect
  if (isAuthenticated && !isAllowed && isRootDashboard) {
    return null;
  }

  // If the path is not allowed for the user's role, block children completely and show access barrier
  if (isAuthenticated && !isAllowed) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200/80 shadow-xs">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-900 border border-amber-200">
            <Lock size={12} />
            <span className="capitalize">{userRole} Role</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Access Restricted
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            Your team role (<strong>{userRole.toUpperCase()}</strong>) does not have
            permission to access <strong>{featureName}</strong> ({pathname}). Please contact
            your store owner or manager if you require access.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.replace(homePath)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-xs hover:bg-brand-800 transition-colors shadow-xs cursor-pointer"
          >
            <span>Go to Your Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
