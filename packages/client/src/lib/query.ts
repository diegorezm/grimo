import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { defaultShouldDehydrateQuery, QueryCache, QueryClient } from "@tanstack/react-query";
import type { AsyncStorage, PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { type ConvexCache, isUnauthorized } from "./convex-cache";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long non-Convex data counts as fresh. Convex queries are never stale for TanStack: their
 * subscription keeps them live while on screen (see convex-cache.ts), so this only covers
 * actions and the auth session.
 */
export const staleTimes = {
  /** Book search results from Open Library (the server caches them for a day too). */
  bookSearch: DAY,
  /** The Better Auth session, so route guards don't hit the server on every navigation. */
  session: 5 * MINUTE,
} as const;

/** Items per "page" of every growing list (feed, followers…): `limit` grows by this much. */
export const PAGE_SIZE = 20;

/** Persisted cache older than this is dropped on load. */
export const CACHE_MAX_AGE = 7 * DAY;
/** Bump to discard every persisted cache (e.g. when response shapes change). */
export const CACHE_VERSION = "5-convex";

/**
 * The app's QueryClient, wired to Convex: Convex keys use `convex.queryFn` and get live updates.
 * `onUnauthorized` runs when a signed-in query is rejected (expired session): sign out there.
 */
export function createQueryClient({
  convex,
  onUnauthorized,
}: {
  convex: ConvexCache;
  onUnauthorized?: () => void;
}) {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isUnauthorized(error)) onUnauthorized?.();
      },
    }),
    defaultOptions: {
      queries: {
        queryFn: convex.queryFn,
        // Keep unused data around as long as it can be persisted, so going back is instant.
        gcTime: CACHE_MAX_AGE,
        retry: (count, error) => !isUnauthorized(error) && count < 2,
        // Show cached data offline instead of failing; refetch when the network returns.
        networkMode: "offlineFirst",
      },
      mutations: { networkMode: "offlineFirst" },
    },
  });
  convex.connect(queryClient);
  return queryClient;
}

/** Key/value storage the persister writes to (localStorage on web, MMKV on mobile). */
export type CacheStorage = AsyncStorage<string>;

/**
 * Options for `PersistQueryClientProvider`: the whole query cache is saved to `storage` and
 * restored on the next launch, so screens render instantly from cache (even offline) while
 * Convex brings them up to date. `scope` separates caches (e.g. per Convex deployment).
 */
export function createPersistOptions(
  storage: CacheStorage,
  scope = "default",
  /** Checked on every save: false writes an empty cache (signed out). */
  enabled: () => boolean = () => true,
): Omit<PersistQueryClientOptions, "queryClient"> {
  return {
    persister: createAsyncStoragePersister({
      storage,
      key: `grimo.cache.${scope}`,
      throttleTime: 1000,
    }),
    maxAge: CACHE_MAX_AGE,
    buster: CACHE_VERSION,
    dehydrateOptions: {
      // Only successful data; never the session (it belongs to the auth client).
      shouldDehydrateQuery: (query) =>
        enabled() && defaultShouldDehydrateQuery(query) && query.queryKey[0] !== "session",
    },
  };
}

/**
 * The app's cache on disk and in memory, and the two ways to wipe it. Both apps use this.
 * Signing out stops persisting until the next sign-in: screens still mounted (and Convex tokens
 * that outlive the session) could otherwise refill the cache and write it back to disk.
 */
export function createAppCache({
  storage,
  scope,
  queryClient,
  convex,
}: {
  storage: CacheStorage;
  scope?: string;
  queryClient: QueryClient;
  convex: ConvexCache;
}) {
  let persisting = true;
  const persistOptions = createPersistOptions(storage, scope, () => persisting);
  async function wipe(persistAfter: boolean) {
    persisting = persistAfter;
    convex.reset();
    queryClient.clear();
    await persistOptions.persister.removeClient();
  }
  return {
    persistOptions,
    /** Signed in: start from an empty cache so nothing from a previous account shows up. */
    clearForSignIn: () => wipe(true),
    /** Signed out (or session rejected): forget everything, in memory and on disk. */
    clearForSignOut: () => wipe(false),
  };
}

/** Keys of the non-Convex queries (Convex ones are `["convexQuery", name, args]`). */
export const queryKeys = {
  session: ["session"] as const,
  bookSearch: (q: string) => ["books", "search", q] as const,
};
