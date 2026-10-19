import { createAppCache, DataProvider } from "@grimo/client";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { cacheStorage } from "@/lib/cache-storage";
import { type AuthClient, authClient, cache, queryClient, setOnUnauthorized } from "@/lib/clients";
import { CONVEX_URL } from "@/lib/server";

// One persisted cache per deployment, so pointing a build elsewhere never mixes data.
const appCache = createAppCache({
  storage: cacheStorage,
  scope: CONVEX_URL,
  queryClient,
  convex: cache,
});

const AppCacheContext = createContext(appCache);

/** Better Auth client (served by Convex). */
export function useAuthClient(): AuthClient {
  return authClient;
}

/**
 * Wipes the query cache, in memory and on disk: `clearForSignIn` on a new session,
 * `clearForSignOut` when it ends (also stops writing to disk until the next sign-in).
 */
export function useAppCache() {
  return useContext(AppCacheContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  // The server rejected the session: forget everything and show the sign-in screen.
  useEffect(
    () =>
      setOnUnauthorized(() => {
        void appCache.clearForSignOut().then(() => authClient.signOut());
      }),
    [],
  );

  return (
    <AppCacheContext.Provider value={appCache}>
      <DataProvider
        cache={cache}
        authClient={authClient}
        queryClient={queryClient}
        persistOptions={appCache.persistOptions}
      >
        {children}
      </DataProvider>
    </AppCacheContext.Provider>
  );
}
