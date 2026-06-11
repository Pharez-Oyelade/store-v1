"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Supplier, SupplierFormValues, SupplierQueryParams } from "@/types";

export const SUPPLIER_KEYS = {
  all: ["suppliers"] as const,
  list: (params?: SupplierQueryParams) => ["suppliers", "list", params] as const,
  detail: (id: string) => ["suppliers", "detail", id] as const,
  summary: ["suppliers", "summary"] as const,
};

interface SupplierListResponse {
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface SupplierSummary {
  total: number;
  preferred: number;
  outstandingBalance: number;
  totalPurchaseAmount: number;
  pendingDeliveries: number;
}

function buildQuery(params?: SupplierQueryParams) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.status) sp.set("status", params.status);
  if (params?.category) sp.set("category", params.category);
  if (params?.search) sp.set("search", params.search);
  const query = sp.toString();
  return query ? `?${query}` : "";
}

export function useSuppliers(params?: SupplierQueryParams) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.list(params),
    queryFn: () => apiGet<SupplierListResponse>(`/suppliers${buildQuery(params)}`),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.detail(id),
    queryFn: () => apiGet<Supplier>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useSupplierSummary() {
  return useQuery({
    queryKey: SUPPLIER_KEYS.summary,
    queryFn: () => apiGet<SupplierSummary>("/suppliers/summary"),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplierFormValues) => apiPost<Supplier>("/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
      toast.success("Supplier saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save supplier"),
  });
}

type UpdateSupplierPayload = Partial<Omit<Supplier, "materials">> & { materials?: string | string[] };

export function useUpdateSupplier(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSupplierPayload) =>
      apiPut<Supplier>(`/suppliers/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
      queryClient.setQueryData(SUPPLIER_KEYS.detail(id), updated);
      toast.success("Supplier updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update supplier"),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
      toast.success("Supplier deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete supplier"),
  });
}
