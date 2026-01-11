"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 1 minute to avoid excessive refetching
        staleTime: 60 * 1000,
        // Prevent refetching when switching active windows/tabs if data is fresh
        refetchOnWindowFocus: false,
        // Retry failed queries 1 time
        retry: 1,
      },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
