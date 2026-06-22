"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentVendor, useIsIitialized } from "@/store/authStore";


/*
 * AdminGuard — client-side role enforcement for /admin/* pages.
 *
 * This is the SECOND layer of protection after the Next.js middleware.
 * The middleware handles the server-side redirect (before page renders).
 * This component handles any edge cases where the token exists but the
 * Zustand store hasn't been initialized yet, or where the role changes
 * during the session.
 *
 * Usage: wrap the admin layout content with this component.
 */
export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = useCurrentVendor();
  const isInitialized = useIsIitialized();

  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return; // Wait for auth state to hydrate from backend

    if (!vendor) {
      router.replace("/login");
      return;
    }

    if (vendor.role !== "admin") {
      // Authenticated vendor but not an admin → back to their dashboard
      router.replace("/dashboard?unauthorized=admin");
    }
  }, [vendor, isInitialized, router]);

  // While auth is initializing, show nothing (avoids flash of wrong content)
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-admin-accent border-t-transparent" />
          <p className="text-sm text-admin-muted">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting non-admins
  if (!vendor || vendor.role !== "admin") return null;

  return <>{children}</>;
}
