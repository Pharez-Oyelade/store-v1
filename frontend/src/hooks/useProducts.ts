"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type {
  Product,
  ProductQueryParams,
  ProductFormValues,
} from "@/types";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
  list: (params?: ProductQueryParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

interface ProductListResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/* ── List Products ──────────────────────────────────────────────── */
export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.status) searchParams.set("status", params.status);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.search) searchParams.set("search", params.search);
      const query = searchParams.toString();
      return apiGet<ProductListResponse>(`/products${query ? `?${query}` : ""}`);
    },
  });
}

/* ── Single Product ─────────────────────────────────────────────── */
export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: !!id,
  });
}

/* ── Create Product ─────────────────────────────────────────────── */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPost<Product>("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success("Product created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

/* ── Update Product ─────────────────────────────────────────────── */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPut<Product>(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.setQueryData(PRODUCT_KEYS.detail(id), updated);
      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

/* ── Delete Product ─────────────────────────────────────────────── */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success("Product deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}

/* ── Bulk Action ────────────────────────────────────────────────── */
export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: string; productIds: string[] }) =>
      apiPost("/products/bulk", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success("Bulk action completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk action failed");
    },
  });
}
