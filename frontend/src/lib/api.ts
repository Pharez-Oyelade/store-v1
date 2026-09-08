// AXIOS CONFIG
import axios, { AxiosError } from "axios";
import type { ApiError } from "@/types";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 10000, //10 seconds - abort request if no response
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      } else if (config.headers) {
        delete (config.headers as any)["Content-Type"];
        delete (config.headers as any)["content-type"];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);


// Response Interceptors - run after every response arrives, handle errors globally
api.interceptors.response.use(
  (response) => {
    /*
     * The backend wraps all responses as { success, data, message }.
     * We unwrap here so hooks receive the actual data payload directly.
     * e.g. apiGet<Product>('/products/123') returns the Product object,
     * not the { success: true, data: Product, message: "..." } envelope.
     */
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    // Track offline state when browser is genuinely offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const { useNetworkStore } = require("@/store/networkStore");
        useNetworkStore.getState().setOnline(false);
      } catch {}
    }

    // Handle 401 unauthorized - auth cookie expired or missing.
    // Only redirect to /login when the user is on a protected route and status is 401.
    // Status 403 (Forbidden) is an authorization restriction and must NOT clear the user session.
    if (status === 401) {
      if (typeof window !== "undefined") {
        const { pathname } = window.location;
        const isProtectedRoute =
          pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

        // Clear Zustand auth store to prevent ghost sessions
        useAuthStore.getState().clearVendor();

        if (isProtectedRoute && !pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }

    const message =
      serverMessage ||
      (status === 404
        ? "Resource not found"
        : status === 403
          ? "You don't have permission to do that"
          : status === 429
            ? "Too many requests. Please slow down."
            : status === 500
              ? "Server error. Please try again later."
              : error.message ||
                "Something went wrong. Please check your connection.");

    const customError = new Error(message);
    (customError as any).status = status;
    return Promise.reject(customError);
  },
);

export async function apiGet<T>(url: string, config?: object): Promise<T> {
  return api.get(url, config) as unknown as Promise<T>;
}
export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: object,
): Promise<T> {
  return api.post(url, data, config) as unknown as Promise<T>;
}
export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: object,
): Promise<T> {
  return api.put(url, data, config) as unknown as Promise<T>;
}
export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: object,
): Promise<T> {
  return api.patch(url, data, config) as unknown as Promise<T>;
}
export async function apiDelete<T>(url: string, config?: object): Promise<T> {
  return api.delete(url, config) as unknown as Promise<T>;
}

/**
 * Resolves the backend API URL for Server Components (RSC) and Server-Side requests.
 * Uses BACKEND_INTERNAL_URL if set, or absolute NEXT_PUBLIC_API_URL, or localhost fallback.
 */
export function getServerApiUrl(): string {
  const rawUrl =
    process.env.BACKEND_INTERNAL_URL ||
    (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith("/")
      ? process.env.NEXT_PUBLIC_API_URL
      : "") ||
    "http://127.0.0.1:5000/api";

  const baseUrl = rawUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  return `${baseUrl}/api`;
}

export default api;
