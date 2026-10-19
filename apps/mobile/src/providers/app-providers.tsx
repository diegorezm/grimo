import { createPersistOptions, DataProvider } from "@grimo/client";
import { createContext, type ReactNode, useCallback, useContext, useEffect } from "react";
import { cacheStorage } from "@/lib/cache-storage";
import { type AuthClient, authClient, cache, queryClient, setOnUnauthorized } from "@/lib/clients";
import { CONVEX_URL } from "@/lib/server";

// One persisted cache per deployment, so pointing a build elsewhere never mixes data.
const persistOptions = createPersistOptions(cacheStorage, CONVEX_URL);

/** Drops every cached query, in memory and on disk (sign-in, sign-out). */
async function clearCache() {
  queryClient.clear();
  await persistOptions.persister.removeClient();
}

const ClearCacheContext = createContext<() => Promise<void>>(clearCache);

/** Better Auth client (served by Convex). */
export function useAuthClient(): AuthClient {
  return authClient;
}

/** Drops every cached query, in memory and on disk (sign-in, sign-out). */
export function useClearCache() {
  return useContext(ClearCacheContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const signOutLocally = useCallback(() => {
    void clearCache().then(() => authClient.signOut());
  }, []);
  useEffect(() => setOnUnauthorized(signOutLocally), [signOutLocally]);

  return (
    <ClearCacheContext.Provider value={clearCache}>
      <DataProvider
        cache={cache}
        authClient={authClient}
        queryClient={queryClient}
        persistOptions={persistOptions}
      >
        {children}
      </DataProvider>
    </ClearCacheContext.Provider>
  );
}
