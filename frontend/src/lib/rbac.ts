export type TeamRole = "owner" | "admin" | "vendor" | "manager" | "tailor" | "sales";

/**
 * Allowed route sections for each authenticated role.
 * Any sub-route under an allowed section (e.g. /dashboard/demands/new) is automatically permitted.
 */
export const ROLE_ALLOWED_SECTIONS: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/orders",
    "/dashboard/invoices",
    "/dashboard/demands",
    "/dashboard/customers",
    "/dashboard/suppliers",
    "/dashboard/analytics",
    "/dashboard/storefront",
    "/dashboard/settings",
  ],
  owner: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/orders",
    "/dashboard/invoices",
    "/dashboard/demands",
    "/dashboard/customers",
    "/dashboard/suppliers",
    "/dashboard/analytics",
    "/dashboard/storefront",
    "/dashboard/settings",
  ],
  vendor: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/orders",
    "/dashboard/invoices",
    "/dashboard/demands",
    "/dashboard/customers",
    "/dashboard/suppliers",
    "/dashboard/analytics",
    "/dashboard/storefront",
    "/dashboard/settings",
  ],
  manager: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/orders",
    "/dashboard/invoices",
    "/dashboard/demands",
    "/dashboard/customers",
    "/dashboard/suppliers",
    "/dashboard/analytics",
    "/dashboard/storefront",
    "/dashboard/settings",
  ],
  tailor: [
    "/dashboard/demands",
    "/dashboard/customers",
  ],
  sales: [
    "/dashboard/products",
    "/dashboard/orders",
    "/dashboard/invoices",
    "/dashboard/customers",
  ],
};

/**
 * Checks whether a given path is allowed for a user role.
 * Handles subroutes (e.g. /dashboard/orders/new matches /dashboard/orders)
 * and guarantees exact matching for root paths.
 */
export function isPathAllowedForRole(
  pathname: string,
  role?: string | null
): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();

  // Primary store owners and platform super admins always have full access
  if (
    normalizedRole === "owner" ||
    normalizedRole === "admin" ||
    normalizedRole === "vendor"
  ) {
    return true;
  }

  // Exact Overview path is available only to owner, admin, and store manager
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return normalizedRole === "manager";
  }

  const allowedSections = ROLE_ALLOWED_SECTIONS[normalizedRole];
  if (!allowedSections || !Array.isArray(allowedSections)) {
    return false;
  }

  // Check if pathname matches an allowed section exactly or as a subroute (e.g. /dashboard/orders/new)
  return allowedSections.some((section) => {
    if (section === "/dashboard") return false;
    return pathname === section || pathname.startsWith(section + "/");
  });
}

/**
 * Returns the default workspace / home path for a specific role
 */
export function getRoleHomePath(role?: string | null): string {
  if (!role) return "/login";
  const normalizedRole = role.toLowerCase().trim();

  if (normalizedRole === "tailor") {
    return "/dashboard/demands";
  }
  if (normalizedRole === "sales") {
    return "/dashboard/orders";
  }
  return "/dashboard";
}

/**
 * Returns a human-friendly feature name for a dashboard route
 */
export function getFeatureNameForPath(pathname: string): string {
  if (pathname.startsWith("/dashboard/products")) return "Products & Inventory";
  if (pathname.startsWith("/dashboard/orders")) return "Orders & Retail Sales";
  if (pathname.startsWith("/dashboard/invoices")) return "Invoices & Payments";
  if (pathname.startsWith("/dashboard/demands")) return "Bespoke Demands & Tailoring";
  if (pathname.startsWith("/dashboard/customers")) return "Customers CRM";
  if (pathname.startsWith("/dashboard/suppliers")) return "Suppliers & Purchases";
  if (pathname.startsWith("/dashboard/analytics")) return "Store Analytics & Metrics";
  if (pathname.startsWith("/dashboard/storefront")) return "Storefront Configuration";
  if (pathname.startsWith("/dashboard/settings")) return "Store Settings & Billing";
  return "This Section";
}
