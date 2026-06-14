"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPut } from "@/lib/api";
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
