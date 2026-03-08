// TANSTACK QUERY CLIENT CONFIG
// Managing all server state

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0, //never auto-retry mutations
    },
  },
});