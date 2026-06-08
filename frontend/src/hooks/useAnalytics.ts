"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type {
  AnalyticsOverview,
  RevenueDataPoint,
  TopProduct,
  Product,
  Customer,
} from "@/types";

export const ANALYTICS_KEYS = {
  overview: ["analytics", "overview"] as const,
  revenue: (period: string) => ["analytics", "revenue", period] as const,
  topProducts: ["analytics", "top-products"] as const,
  slowMovers: ["analytics", "slow-movers"] as const,
  topCustomers: ["analytics", "top-customers"] as const,
};

/* ── Dashboard Overview Metrics ─────────────────────────────────── */
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.overview,
    queryFn: () => apiGet<AnalyticsOverview>("/analytics/overview"),
    staleTime: 30 * 1000, // 30 seconds — refresh on each dashboard visit
  });
}

/* ── Revenue Time Series (for charts) ───────────────────────────── */
export function useRevenueSeries(period: "daily" | "weekly" | "monthly" = "daily") {
  return useQuery({
    queryKey: ANALYTICS_KEYS.revenue(period),
    queryFn: () =>
      apiGet<RevenueDataPoint[]>(`/analytics/revenue?period=${period}`),
    staleTime: 60 * 1000,
  });
}

/* ── Top Products by Revenue ────────────────────────────────────── */
export function useTopProducts() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topProducts,
    queryFn: () => apiGet<TopProduct[]>("/analytics/products/top"),
    staleTime: 5 * 60 * 1000,
  });
}

/* ── Slow Moving Inventory ──────────────────────────────────────── */
export function useSlowMovers() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.slowMovers,
    queryFn: () => apiGet<Product[]>("/analytics/products/slow"),
    staleTime: 5 * 60 * 1000,
  });
}

/* ── Top Customers by LTV ───────────────────────────────────────── */
export function useTopCustomers() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topCustomers,
    queryFn: () => apiGet<Customer[]>("/analytics/customers/top"),
    staleTime: 5 * 60 * 1000,
  });
}
