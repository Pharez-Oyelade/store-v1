import api, { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import type {
  PlatformKPIs,
  AdminVendor,
  AdminVendorQueryParams,
  PaginatedResponse,
  ApiResponse,
  Announcement,
  AnnouncementFormValues,
  AuditLog,
  PlatformRevenueSeries,
  VendorCohort,
  TopPerformer,
  SubscriptionTier,
  BillingHealth,
} from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

/* ─── Query Key Factory ───────────────────────────────────────── */
export const adminKeys = {
  all: ["admin"] as const,
  kpis: () => [...adminKeys.all, "kpis"] as const,
  vendors: (params?: AdminVendorQueryParams) =>
    [...adminKeys.all, "vendors", params] as const,
  vendor: (id: string) => [...adminKeys.all, "vendor", id] as const,
  vendorAuditLog: (id: string) =>
    [...adminKeys.all, "vendor", id, "audit-log"] as const,
  subscriptionTiers: () =>
    [...adminKeys.all, "subscription-tiers"] as const,
  billingHealth: () => [...adminKeys.all, "billing-health"] as const,
  revenue: (period: string, months: number) =>
    [...adminKeys.all, "revenue", period, months] as const,
  cohorts: (months: number) => [...adminKeys.all, "cohorts", months] as const,
  topPerformers: (metric: string, limit: number) =>
    [...adminKeys.all, "top-performers", metric, limit] as const,
  announcements: () => [...adminKeys.all, "announcements"] as const,
};

export function usePlatformKPIs() {
  return useQuery({
    queryKey: adminKeys.kpis(),
    queryFn: async () => {
      return apiGet<PlatformKPIs>("/admin/dashboard/kpis");
    },
    staleTime: 60_000, // 1 minute — KPIs change frequently
  });
}

export function useAdminVendors(params: AdminVendorQueryParams = {}) {
  return useQuery({
    queryKey: adminKeys.vendors(params),
    queryFn: async () => {
      return apiGet<PaginatedResponse<AdminVendor> & { vendors: AdminVendor[] }>(
        "/admin/vendors",
        { params },
      );
    },
  });
}

export function useAdminVendor(id: string) {
  return useQuery({
    queryKey: adminKeys.vendor(id),
    queryFn: async () => {
      return apiGet<AdminVendor>(`/admin/vendors/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useVendorAuditLog(id: string) {
  return useQuery({
    queryKey: adminKeys.vendorAuditLog(id),
    queryFn: async () => {
      return apiGet<AuditLog[]>(`/admin/vendors/${id}/audit-log`);
    },
    enabled: Boolean(id),
  });
}

/* ─── Toggle Vendor Status ────────────────────────────────────── */
export function useToggleVendorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      isActive,
      reason,
    }: {
      id: string;
      isActive: boolean;
      reason?: string;
    }) => {
      return apiPut<any>(`/admin/vendors/${id}/status`, {
        isActive,
        reason,
      });
    },
    onSuccess: (_, { id, isActive }) => {
      qc.invalidateQueries({ queryKey: adminKeys.vendors() });
      qc.invalidateQueries({ queryKey: adminKeys.vendor(id) });
      qc.invalidateQueries({ queryKey: adminKeys.kpis() });
      toast.success(
        isActive ? "Vendor activated successfully" : "Vendor suspended",
      );
    },
    onError: () => toast.error("Failed to update vendor status"),
  });
}

/* ─── Override Vendor Subscription ───────────────────────────── */
export function useOverrideSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      plan,
      reason,
    }: {
      id: string;
      plan: string;
      reason?: string;
    }) => {
      return apiPut<any>(`/admin/vendors/${id}/subscription`, {
        plan,
        reason,
      });
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.vendor(id) });
      qc.invalidateQueries({ queryKey: adminKeys.vendors() });
      toast.success("Subscription updated");
    },
    onError: () => toast.error("Failed to update subscription"),
  });
}

export function useSubscriptionTiers() {
  return useQuery({
    queryKey: adminKeys.subscriptionTiers(),
    queryFn: async () => {
      return apiGet<SubscriptionTier[]>("/admin/subscriptions/tiers");
    },
    staleTime: 5 * 60_000,
  });
}

export function useBillingHealth() {
  return useQuery({
    queryKey: adminKeys.billingHealth(),
    queryFn: async () => {
      return apiGet<BillingHealth>("/admin/subscriptions/health");
    },
    staleTime: 2 * 60_000,
  });
}

export function usePlatformRevenue(
  period: "daily" | "monthly" | "weekly" = "monthly",
  months = 6,
) {
  return useQuery({
    queryKey: adminKeys.revenue(period, months),
    queryFn: async () => {
      return apiGet<PlatformRevenueSeries[]>("/admin/analytics/revenue", {
        params: { period, months },
      });
    },
  });
}

export function useVendorCohorts(months = 6) {
  return useQuery({
    queryKey: adminKeys.cohorts(months),
    queryFn: async () => {
      return apiGet<VendorCohort[]>("/admin/analytics/cohorts", {
        params: { months },
      });
    },
  });
}

export function useTopPerformers(
  metric: "revenue" | "orders" = "revenue",
  limit = 10,
) {
  return useQuery({
    queryKey: adminKeys.topPerformers(metric, limit),
    queryFn: async () => {
      return apiGet<TopPerformer[]>("/admin/analytics/top-performers", {
        params: { metric, limit },
      });
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: adminKeys.announcements(),
    queryFn: async () => {
      return apiGet<Announcement[]>("/admin/announcements");
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AnnouncementFormValues) => {
      return apiPost<Announcement>("/admin/announcements", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.announcements() });
      toast.success("Announcement published");
    },
    onError: () => toast.error("Failed to create announcement"),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: AnnouncementFormValues & { id: string }) => {
      return apiPut<Announcement>(`/admin/announcements/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.announcements() });
      toast.success("Announcement updated");
    },
    onError: () => toast.error("Failed to update announcement"),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiDelete(`/admin/announcements/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.announcements() });
      toast.success("Announcement deleted");
    },
    onError: () => toast.error("Failed to delete announcement"),
  });
}

/* ─── CSV Export ──────────────────────────────────────────────── */
export function useExportData() {
  return useMutation({
    mutationFn: async (type: "vendors" | "subscriptions") => {
      const response = await api.get(`/admin/analytics/export`, {
        params: { type },
        responseType: "blob",
      });

      /* Trigger browser download */
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `vendra-${type}-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Export downloaded"),
    onError: () => toast.error("Export failed"),
  });
}
