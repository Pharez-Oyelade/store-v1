// AXIOS CONFIG
import axios, { AxiosError } from "axios";
import type { ApiError } from "@/types";

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

// Respnse Interceptors - run after every response arrives, handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    // Handle 401 unautorized - auth cookie expired or missing, redirect to /login if not already there

    if (status === 401) {
      if (
        typeof Window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
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
