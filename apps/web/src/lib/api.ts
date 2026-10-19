import {
  type CacheStorage,
  ConvexCache,
  createAppCache,
  createQueryClient,
  queryKeys,
  staleTimes,
} from "@grimo/client";
import { queryOptions } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { authClient, type Session } from "@/lib/auth-client";

if (!import.meta.env.VITE_CONVEX_URL) {
  throw new Error("VITE_CONVEX_URL não definido: rode `pnpm dev` (ou veja apps/web/.env.example).");
}

/** Session expired or revoked: forget everything and go back to the login screen. */
export function signOutLocally() {
  void clearCacheForSignOut().then(() => window.location.assign("/login"));
}

export const cache = new ConvexCache(new ConvexReactClient(import.meta.env.VITE_CONVEX_URL), {
  onUnauthorized: signOutLocally,
});
export const queryClient = createQueryClient({ convex: cache, onUnauthorized: signOutLocally });

/** localStorage that never throws (private mode, blocked storage): the cache just isn't saved. */
const storage: CacheStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};

/** The query cache survives reloads: screens paint from it instantly and revalidate. */
const appCache = createAppCache({ storage, queryClient, convex: cache });
export const { persistOptions } = appCache;

/** Signed in: drop every cached query (memory and disk) so nothing from another account shows. */
export const clearCacheForSignIn = () => appCache.clearForSignIn();
/** Signed out: drop everything and stop writing the cache to disk until the next sign-in. */
export const clearCacheForSignOut = () => appCache.clearForSignOut();

/**
 * Better Auth session, cached (in memory only) so route guards don't hit the server on every
 * navigation. Offline, the server can't answer: fall back to the last session the auth client
 * saw, so a cold start without network still opens the app on the persisted cache.
 */
export const sessionQuery = queryOptions({
  queryKey: queryKeys.session,
  queryFn: async (): Promise<Session | null> => {
    const offline = () => (authClient.getSessionData() as Session | null) ?? null;
    try {
      const { data, error } = await authClient.getSession();
      // A 401 is a real "signed out"; anything else (5xx, no network) keeps the last session.
      if (error && error.status !== 401) return offline();
      return data;
    } catch {
      return offline();
    }
  },
  staleTime: staleTimes.session,
  networkMode: "always",
});
