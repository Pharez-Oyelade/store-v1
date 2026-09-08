// TANSTACK QUERY CLIENT CONFIG
// Managing all server state

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours retention for offline availability
      retry: (failureCount, error: any) => {
        // Don't retry if offline
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        return failureCount < 2;
      },
      networkMode: "offlineFirst",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: 0, // outbox handles retries deterministically
    },
  },
});
