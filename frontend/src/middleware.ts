import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isPathAllowedForRole, getRoleHomePath } from "@/lib/rbac";

/*
 * The name of the auth cookie set by our backend.
 * Must match the cookie name in the backend auth controller.
 */
const AUTH_COOKIE = "access_token";

/*
 * Routes that require authentication to access on the main platform.
 */
const PROTECTED_PATHS = ["/dashboard", "/admin"];

/*
 * Routes that should redirect AWAY if the user IS authenticated.
 */
const AUTH_PATHS = ["/login", "/register"];

/*
 * Routes that require admin role specifically.
 */
const ADMIN_PATHS = ["/admin"];

/*
 * Reserved platform subdomains that should never be treated as vendor boutique handles.
 */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "dashboard",
  "mail",
  "cdn",
  "assets",
  "static",
  "dev",
  "staging",
  "auth",
]);

/*
 * Primary domains of the Vendra platform.
 */
const MAIN_DOMAINS = new Set([
  "tryvendra.ng",
  "vendra.ng",
  "localhost",
  "127.0.0.1",
]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass internal Next.js assets, API routes, public static files, and inactive splash
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/custom-domain-inactive" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Extract and analyze host header
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();
  const hostname = host.split(":")[0];

  let subdomain: string | null = null;
  let isCustomDomain = false;

  // Localhost Subdomain support: e.g. amina.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(/\.localhost$/, "");
    if (!RESERVED_SUBDOMAINS.has(sub)) {
      subdomain = sub;
    }
  } else if (hostname.endsWith(".tryvendra.ng") || hostname.endsWith(".vendra.ng")) {
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        subdomain = sub;
      }
    }
  } else if (!MAIN_DOMAINS.has(hostname) && !hostname.includes("vercel.app")) {
    // External custom apex or subdomain (e.g. shop.aminacouture.com)
    isCustomDomain = true;
  }

  // 3. Handle Vendor Subdomain Rewrites (e.g. amina.vendra.ng/products -> /store/amina/products)
  if (subdomain) {
    // Prevent accessing dashboard/admin via vendor subdomains
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL(`https://tryvendra.ng${pathname}`, request.url));
    }

    // If pathname already starts with /store/[subdomain], pass through
    if (pathname.startsWith(`/store/${subdomain}`)) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 4. Handle Custom Domain Rewrites (e.g. shop.aminacouture.com/products -> /store/amina-couture/products)
  if (isCustomDomain) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL(`https://tryvendra.ng${pathname}`, request.url));
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
      const resolveRes = await fetch(
        `${apiUrl}/storefront/resolve-domain?domain=${encodeURIComponent(hostname)}`,
        { next: { revalidate: 60 } }
      );

      if (resolveRes.ok) {
        const body = await resolveRes.json();
        const vendorData = body?.data;
        if (vendorData?.handle && vendorData?.canBeLive) {
          const url = request.nextUrl.clone();
          url.pathname = `/store/${vendorData.handle}${pathname === "/" ? "" : pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch (e) {
      console.error("[Middleware] Custom domain resolution failed:", e);
    }

    // If unverified, inactive, or not found, rewrite to inactive domain splash
    const splashUrl = request.nextUrl.clone();
    splashUrl.pathname = "/custom-domain-inactive";
    splashUrl.searchParams.set("domain", hostname);
    return NextResponse.rewrite(splashUrl);
  }

  // 5. Standard Platform Auth & RBAC Guards (Runs on main domains)
  const token = request.cookies.get(AUTH_COOKIE);
  const isAuthenticated = Boolean(token?.value);

  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isAdminRoute = ADMIN_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && token?.value) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token.value, secret);
        if (payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        const userRole =
          (payload.role as string) ||
          (payload.isTeamMember ? "tailor" : "owner");
        return NextResponse.redirect(
          new URL(getRoleHomePath(userRole), request.url)
        );
      } catch {
        const response = NextResponse.next();
        response.cookies.delete(AUTH_COOKIE);
        return response;
      }
    }
    return NextResponse.next();
  }

  if (isAdminRoute && isAuthenticated && token?.value) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token.value, secret);

      if (payload.role !== "admin") {
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("unauthorized", "admin");
        return NextResponse.redirect(dashboardUrl);
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      loginUrl.searchParams.set("expired", "1");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
  }

  if (pathname.startsWith("/dashboard") && isAuthenticated && token?.value) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token.value, secret);
      const userRole =
        (payload.role as string) ||
        (payload.isTeamMember ? "tailor" : "owner");

      if (!isPathAllowedForRole(pathname, userRole)) {
        const homePath = getRoleHomePath(userRole);
        const redirectUrl = new URL(homePath, request.url);
        if (pathname !== "/dashboard") {
          redirectUrl.searchParams.set("unauthorized", userRole);
          redirectUrl.searchParams.set("from", pathname);
        }
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err: any) {
      console.error(
        `[Middleware] Dashboard JWT verification failed for ${pathname}:`,
        err?.message || err
      );
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      loginUrl.searchParams.set("expired", "1");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)",
  ],
};
