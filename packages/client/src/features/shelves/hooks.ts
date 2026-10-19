import type { AddToShelfInput, ShelfStatus, UpdateShelfEntryInput } from "@grimo/core";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

type ShelfList = InferResponseType<ApiClient["shelves"]["$get"], 200>;
export type ShelfItem = ShelfList["items"][number];

/** Query options (also used by route loaders to prefetch). Omit `status` for every shelf. */
export function shelfQuery(api: ApiClient, status?: ShelfStatus) {
  return queryOptions({
    queryKey: queryKeys.shelves(status),
    queryFn: () => parseResponse(api.shelves.$get({ query: { status } })),
    staleTime: staleTimes.own,
  });
}

export function useShelf(status?: ShelfStatus) {
  return useQuery(shelfQuery(useApi(), status));
}

/** Shelf changes affect shelves, feed and stats — refresh all of them. */
function useInvalidateReading() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [queryKeys.allShelves, queryKeys.feed, queryKeys.stats].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/**
 * Applies `update` to every cached shelf list right away and returns a rollback.
 * Used by mutations so the UI reacts before the server answers.
 */
function useOptimisticShelves() {
  const queryClient = useQueryClient();
  return async (update: (items: ShelfItem[]) => ShelfItem[]) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.allShelves });
    const previous = queryClient.getQueriesData<ShelfList>({ queryKey: queryKeys.allShelves });
    queryClient.setQueriesData<ShelfList>({ queryKey: queryKeys.allShelves }, (data) =>
      data ? { ...data, items: update(data.items) } : data,
    );
    return () => {
      for (const [key, data] of previous) queryClient.setQueryData(key, data);
    };
  };
}

export function useAddToShelf() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  return useMutation({
    mutationFn: (input: AddToShelfInput) => parseResponse(api.shelves.$post({ json: input })),
    onSettled: invalidate,
  });
}

export function useUpdateShelfEntry() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  const optimistic = useOptimisticShelves();
  return useMutation({
    mutationFn: ({ id, ...json }: UpdateShelfEntryInput & { id: string }) =>
      parseResponse(api.shelves[":id"].$patch({ param: { id }, json })),
    onMutate: ({ id, status, currentPage, rating }) => {
      const patch = {
        ...(status !== undefined && { status }),
        ...(currentPage !== undefined && { currentPage }),
        ...(rating !== undefined && { rating }),
      };
      return optimistic((items) =>
        items.map((item) =>
          item.entry.id === id ? { ...item, entry: { ...item.entry, ...patch } } : item,
        ),
      );
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: invalidate,
  });
}

export function useRemoveFromShelf() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  const optimistic = useOptimisticShelves();
  return useMutation({
    mutationFn: (id: string) => parseResponse(api.shelves[":id"].$delete({ param: { id } })),
    onMutate: (id) => optimistic((items) => items.filter((item) => item.entry.id !== id)),
    onError: (_error, _id, rollback) => rollback?.(),
    onSettled: invalidate,
  });
}
