"use client";

import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient for TanStack Query.
 * Configured for realtime app patterns: short stale time, no retries for mutations.
 */
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 1000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }
  return queryClient;
}
