import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser, LoginCredentials, RegisterPayload } from "@/types";

export const AUTH_QUERY_KEYS = {
  me: ["me"] as const,
} as const;

// useMe - fetch curent vendor on app load
export function useMe() {
  const { setVendor, clearVendor, setInitialized } = useAuthStore();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me,

    queryFn: async () => {
      return apiGet<AuthUser>("/auth/me");
    },

    retry: false,
    staleTime: Infinity, //me data does no gostale on its own
  });
}

// useLogin
export function useLogin() {
  const queryClient = useQueryClient();

  const { setVendor, setInitialized } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      const payload = {
        credential: credentials.email,
        password: credentials.password,
      };
      return apiPost<AuthUser>("/auth/login", payload);
    },

    onSuccess: (vendor) => {
      setVendor(vendor);
      setInitialized(true);

      queryClient.setQueryData(AUTH_QUERY_KEYS.me, vendor);
      toast.success(`Welcome back, ${vendor.businessName}!`);
      router.push("/dashboard");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Login failed. Check your credentials.");
    },
  });
}

// UseRegister
export function useRegister() {
  const queryClient = useQueryClient();
  const { setVendor, setInitialized } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiPost<AuthUser>("/auth/register", payload),

    onSuccess: (vendor) => {
      setVendor(vendor);
      setInitialized(true);
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, vendor);
      toast.success("Account created! Welcome to SabiStore");
      router.push("/dashboard");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Registration failed. Please try again.");
    },
  });
}

// useLogout
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearVendor } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiPost("/auth/logout"),

    onSuccess: () => {
      clearVendor();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
      queryClient.clear(); //nuke all cached queries
      toast.success("signed out successfully.");
      router.push("/login");
    },

    onError: () => {
      // still clear all client state, always logout from UI perspective
      clearVendor();
      queryClient.clear();
      router.push("/login");
    },
  });
}
