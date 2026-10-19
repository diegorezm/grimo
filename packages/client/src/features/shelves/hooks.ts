import { api, type Id } from "@grimo/backend";
import type { AddToShelfInput, ShelfStatus, UpdateShelfEntryInput } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

type ShelfList = FunctionReturnType<typeof api.shelves.list>;
export type ShelfItem = ShelfList["items"][number];

/** Query options (also used by route loaders to prefetch). Omit `status` for every shelf. */
export function shelfQuery(status?: ShelfStatus) {
  return convexQuery(api.shelves.list, status ? { status } : {}, "required");
}

export function useShelf(status?: ShelfStatus) {
  return useQuery(shelfQuery(status));
}

const shelves = [convexQueryPrefix(api.shelves.list)];

export function useAddToShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: AddToShelfInput) => convex.mutation(api.shelves.add, input),
  });
}

/** Dates travel as epoch ms. */
const toMs = (date: Date | null | undefined) =>
  date === undefined ? undefined : date === null ? null : date.getTime();

export function useUpdateShelfEntry() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ id, startedAt, finishedAt, ...patch }: UpdateShelfEntryInput & { id: string }) =>
      convex.mutation(api.shelves.update, {
        id: id as Id<"shelfEntries">,
        ...patch,
        ...(startedAt !== undefined && { startedAt: toMs(startedAt) }),
        ...(finishedAt !== undefined && { finishedAt: toMs(finishedAt) }),
      }),
    onMutate: ({ id, status, currentPage, rating }) => {
      const patch = {
        ...(status !== undefined && { status }),
        ...(currentPage !== undefined && { currentPage }),
        ...(rating !== undefined && { rating }),
      };
      return patchQueries<ShelfList>(shelves, (data) => ({
        ...data,
        items: data.items.map((item) =>
          item.entry.id === id ? { ...item, entry: { ...item.entry, ...patch } } : item,
        ),
      }));
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export function useRemoveFromShelf() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (id: string) =>
      convex.mutation(api.shelves.remove, { id: id as Id<"shelfEntries"> }),
    onMutate: (id) =>
      patchQueries<ShelfList>(shelves, (data) => ({
        ...data,
        items: data.items.filter((item) => item.entry.id !== id),
      })),
    onError: (_error, _id, rollback) => rollback?.(),
  });
}
