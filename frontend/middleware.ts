import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/*
 * The name of the auth cookie set by our backend.
 * Must match the cookie name in the backend auth controller.
 */
const AUTH_COOKIE = "access_token";

/*
 * Routes that require authentication to access.
 * If the user is NOT authenticated and tries to access any of
 * these, they're redirected to /login.
 */
const PROTECTED_PATHS = ["/dashboard", "/admin"];

/*
 * Routes that should redirect AWAY if the user IS authenticated.
 * (No point showing the login page to someone already logged in)
 */
const AUTH_PATHS = ["/login", "/register"];

/*
 * Routes that require admin role specifically.
 * A vendor who is authenticated but NOT an admin will be redirected
 * to their dashboard when trying to access these.
 */
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * request.cookies.get() reads a cookie from the request headers.
   * In Next.js middleware, cookies are available before the page renders.
   */
  const token = request.cookies.get(AUTH_COOKIE);
  const isAuthenticated = Boolean(token?.value);

  // Check if the current path starts with any protected routes
  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  // Check if it's an auth route (login/register)
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Check if it's an admin-only route
  const isAdminRoute = ADMIN_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !isAuthenticated) {
    /*
     * NextResponse.redirect() sends an HTTP 307 redirect.
     * new URL("/login", request.url) builds the full redirect URL
     * using the request's base URL (so it works in both dev and prod).
     *
     * We add `from` query param so after login we can redirect
     * the user back to where they were trying to go.
     */
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Authenticated user visiting /login or /register → go to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /*
   * Role-based check for admin routes.
   *
   * We decode the JWT using `jose` (Edge Runtime compatible — already
   * installed in the project). This is a server-side guard that runs
   * BEFORE the page renders, complementing the client-side AdminGuard.
   *
   * If decoding fails (malformed token) or role !== "admin",
   * redirect to /dashboard with an ?unauthorized flag.
   */
  if (isAdminRoute && isAuthenticated && token?.value) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "fallback-secret",
      );
      const { payload } = await jwtVerify(token.value, secret);

      if (payload.role !== "admin") {
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("unauthorized", "admin");
        return NextResponse.redirect(dashboardUrl);
      }
    } catch {
      /*
       * Token is invalid or expired — treat as unauthenticated.
       * The protect middleware on the backend will also reject it.
       */
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  /*
   * NextResponse.next() passes the request to the next handler
   * (i.e., the page component or API route).
   * Always return something from middleware — never return undefined.
   */
  return NextResponse.next();
}

/*
 * config.matcher — KEEP THIS MINIMAL.
 *
 * Next.js middleware runs on the Edge Runtime and is compiled
 * differently from normal Node.js code. Complex regex patterns
 * in the matcher can cause a "Cannot find middleware module" error
 * at startup because they fail to compile in the Edge environment.
 *
 * Rule: only list the specific route prefixes you actually need.
 * The middleware function itself already handles all cases via
 * NextResponse.next() for anything that doesn't match our checks.
 *
 * DO NOT add catch-all patterns like /((?!_next).*) — they break
 * Next.js middleware compilation.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
