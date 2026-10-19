import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

export type FeedPage = InferResponseType<ApiClient["feed"]["$get"], 200>;
export type FeedItem = FeedPage["items"][number];

export function feedQuery(api: ApiClient) {
  return infiniteQueryOptions({
    queryKey: queryKeys.feed,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      parseResponse(api.feed.$get({ query: { cursor: pageParam, limit: "20" } })),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: staleTimes.social,
  });
}

export function useFeed() {
  return useInfiniteQuery(feedQuery(useApi()));
}
