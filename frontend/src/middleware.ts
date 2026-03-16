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

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

async function verifyToken(token: string) {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_COOKIE);
  let isAuthenticated = false;

  // Verify the token is actually valid
  if (token?.value) {
    isAuthenticated = await verifyToken(token.value);
  }

  // DEBUG
  console.log(
    `[MIDDLEWARE] Path: ${pathname}, Token: ${token?.value ? "exists" : "missing"}, Valid: ${isAuthenticated}`,
  );

  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !isAuthenticated) {
    console.log(
      `[MIDDLEWARE] Protected route accessed without valid auth, redirecting to /login`,
    );
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    console.log(
      `[MIDDLEWARE] Auth route accessed with valid auth, redirecting to /dashboard`,
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path+",
    "/admin",
    "/admin/:path+",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
