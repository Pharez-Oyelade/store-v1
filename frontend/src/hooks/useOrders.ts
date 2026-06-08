"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Order, OrderQueryParams, OrderFormValues } from "@/types";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  list: (params?: OrderQueryParams) => ["orders", "list", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  debtSummary: ["orders", "debt-summary"] as const,
};

interface OrderListResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface DebtSummary {
  totalDebt: number;
  orderCount: number;
}

/* ── List Orders ────────────────────────────────────────────────── */
export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.status) sp.set("status", params.status);
      if (params?.startDate) sp.set("startDate", params.startDate);
      if (params?.endDate) sp.set("endDate", params.endDate);
      const q = sp.toString();
      return apiGet<OrderListResponse>(`/orders${q ? `?${q}` : ""}`);
    },
  });
}

/* ── Single Order ───────────────────────────────────────────────── */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

/* ── Create Order ───────────────────────────────────────────────── */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderFormValues) => apiPost<Order>("/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      toast.success("Order created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}

/* ── Update Order ───────────────────────────────────────────────── */
export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Order>) => apiPut<Order>(`/orders/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.setQueryData(ORDER_KEYS.detail(id), updated);
      toast.success("Order updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order");
    },
  });
}

/* ── Delete Order ───────────────────────────────────────────────── */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      toast.success("Order deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete order");
    },
  });
}

/* ── Debt Summary ───────────────────────────────────────────────── */
export function useDebtSummary() {
  return useQuery({
    queryKey: ORDER_KEYS.debtSummary,
    queryFn: () => apiGet<DebtSummary>("/orders/summary/debt"),
  });
}
