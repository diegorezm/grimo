import {
  type CacheStorage,
  createApiClient,
  createPersistOptions,
  createQueryClient,
  queryKeys,
} from "@grimo/client";
import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const api = createApiClient({ baseUrl: window.location.origin });
export const queryClient = createQueryClient({
  // Session expired on the server: forget everything and go back to the login screen.
  onUnauthorized: () => {
    void clearCache().then(() => window.location.assign("/login"));
  },
});

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
export const persistOptions = createPersistOptions(storage);

/** Better Auth session, cached so route guards don't hit the server on every navigation. */
export const sessionQuery = queryOptions({
  queryKey: queryKeys.session,
  queryFn: async () => (await authClient.getSession()).data,
  staleTime: 5 * 60_000,
});

/** Drops every cached query, in memory and on disk (sign-in, sign-out). */
export async function clearCache() {
  queryClient.clear();
  await persistOptions.persister.removeClient();
}
