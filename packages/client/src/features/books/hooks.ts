import { api } from "@grimo/backend";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { type ConvexCache, convexQuery } from "../../lib/convex-cache";
import { useConvexCache } from "../../lib/provider";
import { queryKeys, staleTimes } from "../../lib/query";

export type BookSearchResult = FunctionReturnType<typeof api.books.search>["items"][number];

/** Open Library search (a Convex action, cached a day on the server and on the device). */
export function bookSearchQuery(cache: ConvexCache, q: string) {
  const query = q.trim();
  return queryOptions({
    queryKey: queryKeys.bookSearch(query),
    queryFn: () => cache.convex.action(api.books.search, { q: query }),
    enabled: query.length >= 2,
    staleTime: staleTimes.bookSearch,
  });
}

/** Search as you type; keeps the previous results on screen while the next ones load. */
export function useBookSearch(q: string) {
  return useQuery({ ...bookSearchQuery(useConvexCache(), q), placeholderData: keepPreviousData });
}

export type BookDetail = NonNullable<FunctionReturnType<typeof api.books.detail>["detail"]>;

/** Book page: the book, your shelf entry, community numbers and reviews. */
export function bookQuery(openLibraryId: string) {
  return convexQuery(api.books.detail, { openLibraryId }, "optional");
}

/**
 * The book page. When we have never fetched its Open Library work page (synopsis, cover), asks
 * the server to; the live query then fills in. `isError` means nobody knows this book.
 */
export function useBook(openLibraryId: string) {
  const cache = useConvexCache();
  const query = useQuery(bookQuery(openLibraryId));
  const needsWork = query.data?.needsWork ?? false;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!needsWork) return;
    let active = true;
    cache.convex
      .action(api.books.loadWork, { openLibraryId })
      .catch(() => {})
      // Still unknown after trying (Open Library unreachable): stop waiting.
      .finally(() => active && setTimeout(() => active && setFailed(true), 3000));
    return () => {
      active = false;
    };
  }, [cache, needsWork, openLibraryId]);

  const detail = query.data?.detail ?? undefined;
  const missing = query.data !== undefined && !detail && (!needsWork || failed);
  return { ...query, data: detail, isError: query.isError || missing };
}
