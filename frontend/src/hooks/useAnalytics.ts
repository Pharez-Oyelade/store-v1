"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  AnalyticsOverview,
  RevenueDataPoint,
  TopProduct,
  Product,
  Customer,
  BespokeVsRtwBreakdown,
  WorkshopProductivity,
  MarginEstimator,
} from "@/types";
import api, { apiGet } from "@/lib/api";

export const ANALYTICS_KEYS = {
  overview: ["analytics", "overview"] as const,
  revenue: (period: string) => ["analytics", "revenue", period] as const,
  topProducts: ["analytics", "top-products"] as const,
  slowMovers: ["analytics", "slow-movers"] as const,
  topCustomers: ["analytics", "top-customers"] as const,
  bespokeVsRtw: ["analytics", "bespoke-vs-rtw"] as const,
  workshop: ["analytics", "workshop"] as const,
  margins: ["analytics", "margins"] as const,
};

/* ── Dashboard Overview Metrics ─────────────────────────────────── */
export function useAnalyticsOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.overview,
    queryFn: () => apiGet<AnalyticsOverview>("/analytics/overview"),
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Revenue Time Series (for charts) ───────────────────────────── */
export function useRevenueSeries(
  period: "daily" | "weekly" | "monthly" | "yearly" = "daily",
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.revenue(period),
    queryFn: () =>
      apiGet<RevenueDataPoint[]>(`/analytics/revenue?period=${period}`),
    staleTime: 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Top Products by Revenue ────────────────────────────────────── */
export function useTopProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topProducts,
    queryFn: () => apiGet<TopProduct[]>("/analytics/products/top"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Slow Moving Inventory (Drape+) ─────────────────────────────── */
export function useSlowMovers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.slowMovers,
    queryFn: () => apiGet<Product[]>("/analytics/products/slow"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Top Customers by LTV (Drape+) ──────────────────────────────── */
export function useTopCustomers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.topCustomers,
    queryFn: () => apiGet<Customer[]>("/analytics/customers/top"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Bespoke vs RTW Breakdown (Atelier+) ────────────────────────── */
export function useBespokeVsRtwBreakdown(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.bespokeVsRtw,
    queryFn: () => apiGet<BespokeVsRtwBreakdown>("/analytics/bespoke-vs-rtw"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Workshop & Tailor Productivity (Atelier+) ─────────────────── */
export function useWorkshopProductivity(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.workshop,
    queryFn: () => apiGet<WorkshopProductivity>("/analytics/workshop"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Margin & Unit Economics Estimator (Atelier+) ───────────────── */
export function useMarginEstimator(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.margins,
    queryFn: () => apiGet<MarginEstimator>("/analytics/margins"),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

/* ── Vendor CSV Export Download Trigger ─────────────────────────── */
export async function downloadVendorCsv(
  type: "orders" | "customers" | "inventory" | "financials",
  vendorHandle: string = "store"
) {
  const response = await api.get(`/analytics/export?type=${type}`, {
    responseType: "blob",
  });

  /*
   * Axios response interceptor unwraps response.data, so response is already
   * the Blob itself (or BlobPart). Do NOT access response.data or it will be undefined!
   */
  const blob =
    response instanceof Blob
      ? response
      : new Blob([response as unknown as BlobPart], { type: "text/csv;charset=utf-8;" });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `${vendorHandle}-${type}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
