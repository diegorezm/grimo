import { DataProvider } from "@grimo/client";
import type { ReactNode } from "react";
import { cache, persistOptions, queryClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DataProvider
      cache={cache}
      authClient={authClient}
      queryClient={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </DataProvider>
  );
}
