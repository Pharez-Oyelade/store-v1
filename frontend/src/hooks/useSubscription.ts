import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiGet } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { SubscriptionStatus } from "@/types";

export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: ["subscription", "current"],
    queryFn: () => apiGet("/subscriptions/current"),
  });
};

export const useInitializeUpgrade = () => {
  return useMutation({
    mutationFn: (data: { plan: string }) => apiPost("/subscriptions/initialize", data),
    onError: (error: any) => {
      toast.error(error.message || "Failed to initialize payment");
    },
  });
};

export const useVerifyUpgrade = () => {
  const queryClient = useQueryClient();
  const setVendor = useAuthStore((state) => state.setVendor);
  const vendor = useAuthStore((state) => state.vendor);

  return useMutation({
    mutationFn: (data: { reference: string }) => apiPost("/subscriptions/verify", data),
    onSuccess: (data: any) => {
      toast.success(`Successfully upgraded to ${data.plan} plan!`);
      queryClient.invalidateQueries({ queryKey: ["subscription", "current"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      
      // Update local auth store so UI reflects it immediately
      if (vendor) {
        setVendor({ ...vendor, subscriptionPlan: data.plan, subscriptionStatus: SubscriptionStatus.Active });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify payment");
    },
  });
};
