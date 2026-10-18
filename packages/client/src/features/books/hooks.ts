import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export type BookSearchResult = InferResponseType<
  ApiClient["books"]["search"]["$get"],
  200
>["items"][number];

export function useBookSearch(q: string) {
  const api = useApi();
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.bookSearch(query),
    queryFn: () => parseResponse(api.books.search.$get({ query: { q: query } })),
    enabled: query.length >= 2,
    staleTime: 60 * 60_000,
  });
}
