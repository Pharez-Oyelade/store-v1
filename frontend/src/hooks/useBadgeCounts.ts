import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export interface BadgeCounts {
  invoices: number;
  demands: number;
  orders: number;
  totalActionable: number;
}

export const BADGE_COUNT_KEYS = {
  all: ["vendor-badge-counts"] as const,
};

const DEFAULT_COUNTS: BadgeCounts = {
  invoices: 0,
  demands: 0,
  orders: 0,
  totalActionable: 0,
};

/**
 * Real-time actionable badge counts for navigation items:
 * - invoices: Unreviewed manual payment proofs awaiting vendor action
 * - demands: Active bespoke demands that have surpassed their deadline
 * - orders: Incoming orders pending confirmation
 * - totalActionable: Aggregated total of all actionable items
 */
export function useBadgeCounts() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useQuery<BadgeCounts>({
    queryKey: BADGE_COUNT_KEYS.all,
    queryFn: () => apiGet<BadgeCounts>("/vendor/badge-counts"),
    enabled: isAuthenticated,
    refetchInterval: 45_000, // Poll every 45s in background
    staleTime: 20_000,
  });

  return {
    ...query,
    badgeCounts: query.data ?? DEFAULT_COUNTS,
  };
}
