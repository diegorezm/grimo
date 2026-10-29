import { api } from "@grimo/backend";
import type { ManualBookInput, ShelfStatus } from "@grimo/core";
import { keepPreviousData, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
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

/** The book page's book as `shelves.add` and `groups.create` take it (only the book's fields). */
export function bookInputOf(book: BookDetail["book"]): BookSearchResult {
  const { openLibraryId, title, authors, coverUrl, pageCount, publishedYear, genres } = book;
  return { openLibraryId, title, authors, coverUrl, pageCount, publishedYear, genres };
}

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
  // Which book gave up waiting: a different book (side peek switching) starts clean.
  const [failedId, setFailedId] = useState<string | null>(null);
  const failed = failedId === openLibraryId;

  useEffect(() => {
    if (!needsWork) return;
    let active = true;
    cache.convex
      .action(api.books.loadWork, { openLibraryId })
      .catch(() => {})
      // Still unknown after trying (Open Library unreachable): stop waiting.
      .finally(() => active && setTimeout(() => active && setFailedId(openLibraryId), 3000));
    return () => {
      active = false;
    };
  }, [cache, needsWork, openLibraryId]);

  const detail = query.data?.detail ?? undefined;
  const missing = query.data !== undefined && !detail && (!needsWork || failed);
  return { ...query, data: detail, isError: query.isError || missing };
}

/** "Cadastrar livro": a book Open Library doesn't have. Resolves with its id (to open it). */
export function useAddManualBook() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: ManualBookInput & { status: ShelfStatus }) =>
      convex.mutation(api.books.addManual, input),
  });
}
