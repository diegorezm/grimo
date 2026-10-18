import type { AddToShelfInput, ShelfStatus, UpdateShelfEntryInput } from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export type ShelfItem = InferResponseType<ApiClient["shelves"]["$get"], 200>["items"][number];

export function useShelf(status?: ShelfStatus) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.shelves(status),
    queryFn: () => parseResponse(api.shelves.$get({ query: { status } })),
  });
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

export function useAddToShelf() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  return useMutation({
    mutationFn: (input: AddToShelfInput) => parseResponse(api.shelves.$post({ json: input })),
    onSuccess: invalidate,
  });
}

export function useUpdateShelfEntry() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  return useMutation({
    mutationFn: ({ id, ...json }: UpdateShelfEntryInput & { id: string }) =>
      parseResponse(api.shelves[":id"].$patch({ param: { id }, json })),
    onSuccess: invalidate,
  });
}

export function useRemoveFromShelf() {
  const api = useApi();
  const invalidate = useInvalidateReading();
  return useMutation({
    mutationFn: (id: string) => parseResponse(api.shelves[":id"].$delete({ param: { id } })),
    onSuccess: invalidate,
  });
}
