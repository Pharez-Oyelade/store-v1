"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPut, apiDelete } from "@/lib/api";
import type { Customer, CustomerQeryParams, Order } from "@/types";

export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  list: (params?: CustomerQeryParams) =>
    ["customers", "list", params] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};

interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface CustomerDetail extends Customer {
  orders: Order[];
}

/* ── List Customers ─────────────────────────────────────────────── */
export function useCustomers(params?: CustomerQeryParams) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.search) sp.set("search", params.search);
      const q = sp.toString();
      return apiGet<CustomerListResponse>(
        `/customers${q ? `?${q}` : ""}`,
      );
    },
  });
}

/* ── Single Customer (with orders) ──────────────────────────────── */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: () => apiGet<CustomerDetail>(`/customers/${id}`),
    enabled: !!id,
  });
}

/* ── Update Customer ────────────────────────────────────────────── */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      apiPut<Customer>(`/customers/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      queryClient.setQueryData(CUSTOMER_KEYS.detail(id), (old: any) => {
        if (!old) return updated;
        return { ...old, ...updated };
      });
      toast.success("Customer updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });
}

/* ── Delete Customer ────────────────────────────────────────────── */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      toast.success("Customer deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete customer");
    },
  });
}
