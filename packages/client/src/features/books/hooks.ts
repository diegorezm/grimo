import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

export type BookSearchResult = InferResponseType<
  ApiClient["books"]["search"]["$get"],
  200
>["items"][number];

export function bookSearchQuery(api: ApiClient, q: string) {
  const query = q.trim();
  return queryOptions({
    queryKey: queryKeys.bookSearch(query),
    queryFn: () => parseResponse(api.books.search.$get({ query: { q: query } })),
    enabled: query.length >= 2,
    staleTime: staleTimes.bookSearch,
  });
}

/** Search as you type; keeps the previous results on screen while the next ones load. */
export function useBookSearch(q: string) {
  return useQuery({ ...bookSearchQuery(useApi(), q), placeholderData: keepPreviousData });
}

export type BookDetail = InferResponseType<ApiClient["books"][":openLibraryId"]["$get"], 200>;

/** Book page: the book, your shelf entry, community numbers and reviews. */
export function bookQuery(api: ApiClient, openLibraryId: string) {
  return queryOptions({
    queryKey: queryKeys.book(openLibraryId),
    queryFn: () => parseResponse(api.books[":openLibraryId"].$get({ param: { openLibraryId } })),
    staleTime: staleTimes.own,
  });
}

export function useBook(openLibraryId: string) {
  return useQuery(bookQuery(useApi(), openLibraryId));
}
