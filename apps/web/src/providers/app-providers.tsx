import { ApiProvider } from "@grimo/client";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { api, persistOptions, queryClient } from "@/lib/api";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ApiProvider client={api}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        {children}
      </PersistQueryClientProvider>
    </ApiProvider>
  );
}
