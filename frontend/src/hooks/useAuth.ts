import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getRoleHomePath, isPathAllowedForRole } from "@/lib/rbac";
import { clearPersistedQueryCache } from "@/lib/offline/queryPersister";
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
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      const payload = {
        credential: credentials.credential,
        password: credentials.password,
      };
      return apiPost<AuthUser>("/auth/login", payload);
    },

    onSuccess: (vendor) => {
      setVendor(vendor);
      setInitialized(true);

      queryClient.setQueryData(AUTH_QUERY_KEYS.me, vendor);
      const displayName = vendor.user?.name || vendor.businessName;
      toast.success(`Welcome back, ${displayName}!`);
      
      const userRole = vendor.user?.role || vendor.role || "owner";
      const from = searchParams.get("from");
      if (vendor.role === "admin") {
        router.push("/admin");
      } else if (from && isPathAllowedForRole(from, userRole)) {
        router.push(from);
      } else {
        router.push(getRoleHomePath(userRole));
      }
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
      toast.success("Account created! Welcome to Vendra");
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

    onMutate: async () => {
      // Optimistic UI change: Immediately clear client state, query caches, and redirect
      clearVendor();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
      queryClient.clear(); // Nuke in-memory cache immediately
      clearPersistedQueryCache().catch(() => {}); // Nuke IndexedDB offline cache
      toast.success("Signed out successfully.");
      router.replace("/login");
    },

    onSuccess: () => {
      // Backend cookie was successfully expired; state already cleared optimistically
    },

    onError: () => {
      // Even if network fails or offline, local state and UI are already securely cleared
    },
  });
}
