"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import type { Vendor } from "@/types";

export const VENDOR_KEYS = {
  profile: ["vendor", "profile"] as const,
};

export interface VendorProfilePayload {
  businessName?: string;
  bio?: string;
  state?: string;
  city?: string;
  area?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  socialMessaging?: {
    orderConfirmedTemplate?: string;
    orderDispatchedTemplate?: string;
    orderCompletedTemplate?: string;
  };
}

export function useVendorProfile() {
  return useQuery({
    queryKey: VENDOR_KEYS.profile,
    queryFn: () => apiGet<Vendor>("/vendor/profile"),
  });
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorProfilePayload) => apiPut<Vendor>("/vendor/profile", data),
    onSuccess: (vendor) => {
      queryClient.setQueryData(VENDOR_KEYS.profile, vendor);
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update profile"),
  });
}

export function useUpdateStorefrontSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiPut<any>("/vendor/storefront-settings", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile });
      toast.success("Storefront settings saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update settings"),
  });
}

export function useUpdateStorefrontBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => apiPut<any>("/vendor/storefront-banner", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile });
      toast.success("Storefront banner uploaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to upload banner"),
  });
}

export function useVendorDiscounts() {
  return useQuery({
    queryKey: ["vendor", "discounts"],
    queryFn: () => apiGet<any[]>("/vendor/discounts"),
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiPost<any>("/vendor/discounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "discounts"] });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile });
      toast.success("Discount code created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create discount"),
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discountId: string) => apiDelete<any>(`/vendor/discounts/${discountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", "discounts"] });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile });
      toast.success("Discount removed");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete discount"),
  });
}
