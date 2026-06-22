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

    // Handle 401 unautorized - auth cookie expired or missing, redirect to /login if not already there

    if (status === 401 || status === 403) {
      if (
        typeof window !== "undefined"
      ) {
        // Clear Zustand auth store to prevent infinite redirect loops or ghost sessions
        useAuthStore.getState().clearVendor();
        
        if (!window.location.pathname.startsWith("/login")) {
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

    return Promise.reject(new Error(message));
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

export default api;
