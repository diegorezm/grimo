import { ApiProvider, createPersistOptions, createQueryClient } from "@grimo/client";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cacheStorage } from "@/lib/cache-storage";
import { type AuthClient, getClients } from "@/lib/clients";
import { useServerStore } from "@/lib/server";

const queryClient = createQueryClient();
const AuthClientContext = createContext<AuthClient | null>(null);
const ClearCacheContext = createContext<() => Promise<void>>(async () => {});

/** Better Auth client for the currently selected server. */
export function useAuthClient() {
  const client = useContext(AuthClientContext);
  if (!client) throw new Error("useAuthClient must be used inside <AppProviders>");
  return client;
}

/** Drops every cached query, in memory and on disk (sign-in, sign-out). */
export function useClearCache() {
  return useContext(ClearCacheContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const serverUrl = useServerStore((state) => state.serverUrl);
  const hydrated = useHydrated();
  const { authClient, api } = getClients(serverUrl);
  // One persisted cache per server, so switching servers never mixes their data.
  const persistOptions = useMemo(() => createPersistOptions(cacheStorage, serverUrl), [serverUrl]);

  // Switching servers = different data; drop what is in memory from the previous one.
  useEffect(() => {
    queryClient.clear();
  }, [serverUrl]);

  const clearCache = useCallback(async () => {
    queryClient.clear();
    await persistOptions.persister.removeClient();
  }, [persistOptions]);

  if (!hydrated) return null;
  return (
    <AuthClientContext.Provider value={authClient}>
      <ClearCacheContext.Provider value={clearCache}>
        <ApiProvider client={api}>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            {children}
          </PersistQueryClientProvider>
        </ApiProvider>
      </ClearCacheContext.Provider>
    </AuthClientContext.Provider>
  );
}

/** Waits until the saved server URL is loaded from SecureStore. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(useServerStore.persist.hasHydrated());
  useEffect(() => useServerStore.persist.onFinishHydration(() => setHydrated(true)), []);
  return hydrated;
}
