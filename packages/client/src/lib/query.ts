import { QueryClient } from "@tanstack/react-query";
import { DetailedError, parseResponse } from "hono/client";

export { parseResponse };

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => !isUnauthorized(error) && count < 2,
      },
    },
  });
}

export function isUnauthorized(error: unknown) {
  return error instanceof DetailedError && error.statusCode === 401;
}

/** Single place for cache keys — invalidate by prefix (e.g. `["shelves"]`). */
export const queryKeys = {
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
