"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";

import { getQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app with TanStack Query context.
 * The query client is a singleton so its cache persists across navigations.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
