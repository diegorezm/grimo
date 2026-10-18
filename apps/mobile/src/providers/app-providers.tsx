import { ApiProvider, createQueryClient } from "@grimo/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { type AuthClient, getClients } from "@/lib/clients";
import { useServerStore } from "@/lib/server";

const queryClient = createQueryClient();
const AuthClientContext = createContext<AuthClient | null>(null);

/** Better Auth client for the currently selected server. */
export function useAuthClient() {
  const client = useContext(AuthClientContext);
  if (!client) throw new Error("useAuthClient must be used inside <AppProviders>");
  return client;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const serverUrl = useServerStore((state) => state.serverUrl);
  const hydrated = useHydrated();
  const { authClient, api } = getClients(serverUrl);

  // Switching servers = different data; drop everything cached from the previous one.
  useEffect(() => {
    queryClient.clear();
  }, [serverUrl]);

  if (!hydrated) return null;
  return (
    <AuthClientContext.Provider value={authClient}>
      <ApiProvider client={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    </AuthClientContext.Provider>
  );
}

/** Waits until the saved server URL is loaded from SecureStore. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(useServerStore.persist.hasHydrated());
  useEffect(() => useServerStore.persist.onFinishHydration(() => setHydrated(true)), []);
  return hydrated;
}
