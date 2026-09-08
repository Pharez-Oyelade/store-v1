import { SubscriptionPlan } from "@/types";

export const PLAN_TIER_WEIGHTS: Record<string, number> = {
  free: 0,
  stitch: 1,
  drape: 2,
  atelier: 3,
  maison: 4,
};

/**
 * Checks whether a user's subscription plan meets or exceeds the required minimum plan.
 */
export function hasMinPlan(
  userPlan: SubscriptionPlan | string | undefined | null,
  requiredPlan: SubscriptionPlan | string
): boolean {
  const normUser = (userPlan || "free").toLowerCase();
  const normRequired = requiredPlan.toLowerCase();

  const userWeight = PLAN_TIER_WEIGHTS[normUser] ?? 0;
  const requiredWeight = PLAN_TIER_WEIGHTS[normRequired] ?? 0;

  return userWeight >= requiredWeight;
}

/**
 * Maps plan IDs to their official brand names.
 */
export function getPlanDisplayName(plan: string | undefined | null): string {
  switch (plan?.toLowerCase()) {
    case "free":
      return "Free";
    case "stitch":
      return "The Stitch";
    case "drape":
      return "The Drape";
    case "atelier":
      return "The Atelier";
    case "maison":
      return "The Maison";
    default:
      return "Free";
  }
}

/**
 * Feature-level authorization checkers for UI components.
 */
export const SubscriptionPermissions = {
  // Store Analytics
  canAccessAnalytics: (plan: string | undefined | null) => hasMinPlan(plan, "stitch"),
  canAccessCoreReports: (plan: string | undefined | null) => hasMinPlan(plan, "drape"),
  canAccessAtelierBI: (plan: string | undefined | null) => hasMinPlan(plan, "atelier"),
  
  // Suppliers
  canAccessSuppliers: (plan: string | undefined | null) => hasMinPlan(plan, "stitch"),
  hasUnlimitedSuppliers: (plan: string | undefined | null) => hasMinPlan(plan, "drape"),

  // WhatsApp Messaging
  canCustomizeWhatsApp: (plan: string | undefined | null) => hasMinPlan(plan, "drape"),

  // Data Exports
  canExportOrdersCsv: (plan: string | undefined | null) => hasMinPlan(plan, "drape"),
  canExportFullCsvSuite: (plan: string | undefined | null) => hasMinPlan(plan, "atelier"),

  // Team
  canInviteTeam: (plan: string | undefined | null) => hasMinPlan(plan, "drape"),
};
