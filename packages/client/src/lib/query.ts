import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { defaultShouldDehydrateQuery, QueryCache, QueryClient } from "@tanstack/react-query";
import type { AsyncStorage, PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { DetailedError, parseResponse } from "hono/client";

export { parseResponse };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long each kind of data counts as fresh (no refetch while fresh). Mutations update the cache
 * directly (optimistic + invalidation), so "fresh" can be generous: the screen is already right.
 */
export const staleTimes = {
  /** Instance mode/name: changes only when the admin reconfigures the server. */
  instance: HOUR,
  /** Book search results from Open Library. */
  bookSearch: DAY,
  /** Your own data (profile, shelves, stats): only you change it, and mutations keep it current. */
  own: 10 * MINUTE,
  /** Other people's data (feed, readers, posts). */
  social: MINUTE,
  /** Summaries of months that are over. */
  pastMonth: DAY,
} as const;

/** Persisted cache older than this is dropped on load. */
export const CACHE_MAX_AGE = 7 * DAY;
/** Bump to discard every persisted cache (e.g. when response shapes change). */
export const CACHE_VERSION = "1";

/** `onUnauthorized` runs when any query gets a 401 (expired session): sign the user out there. */
export function createQueryClient({ onUnauthorized }: { onUnauthorized?: () => void } = {}) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isUnauthorized(error)) onUnauthorized?.();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: staleTimes.social,
        // Keep unused data around as long as it can be persisted, so going back is instant.
        gcTime: CACHE_MAX_AGE,
        retry: (count, error) => !isUnauthorized(error) && count < 2,
        // Show cached data offline instead of failing; refetch when the network returns.
        networkMode: "offlineFirst",
      },
      mutations: { networkMode: "offlineFirst" },
    },
  });
}

export function isUnauthorized(error: unknown) {
  return error instanceof DetailedError && error.statusCode === 401;
}

/** Key/value storage the persister writes to (localStorage on web, AsyncStorage on mobile). */
export type CacheStorage = AsyncStorage<string>;

/**
 * Options for `PersistQueryClientProvider`: the whole query cache is saved to `storage` and
 * restored on the next launch, so screens render instantly from cache while revalidating.
 * `scope` separates caches per server (and should change when the signed-in user changes).
 */
export function createPersistOptions(
  storage: CacheStorage,
  scope = "default",
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
        defaultShouldDehydrateQuery(query) && query.queryKey[0] !== "session",
    },
  };
}

/** Single place for cache keys — invalidate by prefix (e.g. `["shelves"]`). */
export const queryKeys = {
  session: ["session"] as const,
  instance: ["instance"] as const,
  me: ["me"] as const,
  reader: (username: string) => ["readers", username] as const,
  bookSearch: (q: string) => ["books", "search", q] as const,
  allShelves: ["shelves"] as const,
  shelves: (status?: string) => ["shelves", status ?? "all"] as const,
  feed: ["feed"] as const,
  post: (id: string) => ["posts", id] as const,
  stats: ["stats"] as const,
  yearOverview: (year: number) => ["stats", "overview", year] as const,
  monthlySummary: (month: string) => ["stats", "monthly", month] as const,
};
