import { useInfiniteQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export type FeedItem = InferResponseType<ApiClient["feed"]["$get"], 200>["items"][number];

export function useFeed() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: queryKeys.feed,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      parseResponse(api.feed.$get({ query: { cursor: pageParam, limit: "20" } })),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
