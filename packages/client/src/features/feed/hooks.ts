import { api } from "@grimo/backend";
import { useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { PAGE_SIZE } from "../../lib/query";

export type FeedPage = FunctionReturnType<typeof api.feed.list>;
export type FeedItem = FeedPage["items"][number];

/** First page of the feed (route loaders prefetch it). */
export function feedQuery() {
  return convexQuery(api.feed.list, { limit: PAGE_SIZE }, "required");
}

/** My activities + the people I follow, newest first. Live: new activity shows up by itself. */
export function useFeed() {
  return useGrowingList(api.feed.list, {}, "required");
}

/** Just the newest items (dashboard previews), sharing the feed's first page in the cache. */
export function useFeedPreview() {
  return useQuery(feedQuery());
}
