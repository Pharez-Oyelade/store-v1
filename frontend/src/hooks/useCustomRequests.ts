"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api";
import type {
  CustomRequest,
  CustomRequestQueryParams,
  CustomRequestSummary,
} from "@/types";

export const CUSTOM_REQUEST_KEYS = {
  all: ["custom-requests"] as const,
  list: (params?: CustomRequestQueryParams) =>
    ["custom-requests", "list", params] as const,
  detail: (id: string) => ["custom-requests", "detail", id] as const,
  summary: ["custom-requests", "summary"] as const,
};

interface CustomRequestListResponse {
  requests: CustomRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/* ── List Custom Requests ───────────────────────────────────────── */
export function useCustomRequests(params?: CustomRequestQueryParams) {
  return useQuery({
    queryKey: CUSTOM_REQUEST_KEYS.list(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.status && params.status !== "all") sp.set("status", params.status);
      if (params?.category) sp.set("category", params.category);
      if (params?.search) sp.set("search", params.search);
      if (params?.sort) sp.set("sort", params.sort);
      if (params?.order) sp.set("order", params.order);
      const q = sp.toString();
      return apiGet<CustomRequestListResponse>(
        `/custom-requests${q ? `?${q}` : ""}`
      );
    },
  });
}

/* ── Single Custom Request ──────────────────────────────────────── */
export function useCustomRequest(id: string) {
  return useQuery({
    queryKey: CUSTOM_REQUEST_KEYS.detail(id),
    queryFn: () => apiGet<CustomRequest>(`/custom-requests/${id}`),
    enabled: !!id,
  });
}

/* ── Summary Stats ──────────────────────────────────────────────── */
export function useCustomRequestSummary() {
  return useQuery({
    queryKey: CUSTOM_REQUEST_KEYS.summary,
    queryFn: () => apiGet<CustomRequestSummary>("/custom-requests/summary"),
  });
}

/* ── Create Custom Request ──────────────────────────────────────── */
export function useCreateCustomRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) =>
      apiPost<CustomRequest>(
        "/custom-requests",
        data,
        data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_REQUEST_KEYS.all });
      toast.success("Bespoke request recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create request");
    },
  });
}

/* ── Update Custom Request ──────────────────────────────────────── */
export function useUpdateCustomRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | Partial<CustomRequest>) =>
      apiPut<CustomRequest>(
        `/custom-requests/${id}`,
        data,
        data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
      ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_REQUEST_KEYS.all });
      queryClient.setQueryData(CUSTOM_REQUEST_KEYS.detail(id), updated);
      toast.success("Request updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update request");
    },
  });
}


/* ── Delete Custom Request ──────────────────────────────────────── */
export function useDeleteCustomRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/custom-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_REQUEST_KEYS.all });
      toast.success("Request deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete request");
    },
  });
}

/* ── Toggle Material Acquired Status ────────────────────────────── */
export function useToggleMaterialAcquired(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (materialIndex: number) =>
      apiPatch<CustomRequest>(
        `/custom-requests/${requestId}/materials/${materialIndex}/toggle`,
        {}
      ),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_REQUEST_KEYS.all });
      queryClient.setQueryData(CUSTOM_REQUEST_KEYS.detail(requestId), updated);
      toast.success("Material status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update material status");
    },
  });
}
