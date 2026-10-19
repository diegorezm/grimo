import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  type PersistQueryClientProviderProps,
} from "@tanstack/react-query-persist-client";
import { useConvexAuth } from "convex/react";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import type { ConvexCache } from "./convex-cache";

const ConvexCacheContext = createContext<ConvexCache | null>(null);

/** The Convex bridge (and its client, `.convex`) for mutations and actions in hooks. */
export function useConvexCache(): ConvexCache {
  const cache = useContext(ConvexCacheContext);
  if (!cache) throw new Error("useConvexCache must be used inside <DataProvider>");
  return cache;
}

/** Tells the bridge where Convex auth stands, so signed-in queries wait for it. */
function ConvexAuthSync({ cache }: { cache: ConvexCache }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  useEffect(() => {
    cache.setAuth(isLoading ? "pending" : isAuthenticated ? "signed-in" : "signed-out");
  }, [cache, isLoading, isAuthenticated]);
  return null;
}

/**
 * Everything data needs, for web and mobile: Convex authenticated with Better Auth, and the
 * persisted TanStack Query cache that screens render from.
 */
export function DataProvider({
  cache,
  authClient,
  queryClient,
  persistOptions,
  onSuccess,
  children,
}: {
  cache: ConvexCache;
  /**
   * The app's Better Auth client (with `sharedAuthClientPlugins`). Typed loosely: the
   * component's `AuthClient` type rejects clients whose plugins extend the session (username).
   */
  authClient: object;
  queryClient: QueryClient;
  persistOptions: PersistQueryClientProviderProps["persistOptions"];
  /** Runs once the persisted cache has been restored. */
  onSuccess?: () => void;
  children: ReactNode;
}) {
  return (
    <ConvexBetterAuthProvider client={cache.convex} authClient={authClient as AuthClient}>
      <ConvexAuthSync cache={cache} />
      <ConvexCacheContext.Provider value={cache}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
          onSuccess={onSuccess}
        >
          {children}
        </PersistQueryClientProvider>
      </ConvexCacheContext.Provider>
    </ConvexBetterAuthProvider>
  );
}
