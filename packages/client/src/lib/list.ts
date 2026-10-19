import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useState } from "react";
import { convexQuery, type QueryAuth } from "./convex-cache";
import { PAGE_SIZE } from "./query";

type ListQuery = FunctionReference<"query", "public", { limit: number }, { hasMore: boolean }>;

/**
 * A live list that loads more by asking for a bigger `limit` (20, 40, 60…). One reactive query
 * per list: new items show up by themselves, and the persisted cache holds the first page so it
 * renders instantly. The previous items stay on screen while the next ones load.
 */
export function useGrowingList<F extends ListQuery>(
  fn: F,
  args: Omit<FunctionArgs<F>, "limit">,
  auth: QueryAuth,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const query = useQuery({
    ...convexQuery(fn, { ...args, limit } as FunctionArgs<F>, auth),
    placeholderData: keepPreviousData,
    enabled,
  });
  const data = query.data as FunctionReturnType<F> | undefined;
  return {
    ...query,
    data,
    hasNextPage: Boolean(data?.hasMore),
    isFetchingNextPage: query.isPlaceholderData && query.isFetching,
    fetchNextPage: () => {
      if (data?.hasMore && !query.isPlaceholderData) setLimit(limit + PAGE_SIZE);
    },
  };
}
