import { ApiProvider } from "@grimo/client";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api, queryClient } from "@/lib/api";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ApiProvider client={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );
}
