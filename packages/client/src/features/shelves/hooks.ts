import { api, type Id } from "@grimo/backend";
import type {
  AddToShelfInput,
  ShelfStatus,
  UpdateNoteInput,
  UpdateShelfEntryInput,
} from "@grimo/core";
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

/** How many books "Amigos querem ler" shows. */
const FRIENDS_WANT_LIMIT = 12;

export type FriendsWantItem = FunctionReturnType<typeof api.shelves.friendsWant>["items"][number];

/** Books the people you follow want to read, the most wanted first (route loaders prefetch it). */
export function friendsWantQuery() {
  return convexQuery(api.shelves.friendsWant, { limit: FRIENDS_WANT_LIMIT }, "required");
}

export function useFriendsWant() {
  return useQuery(friendsWantQuery());
}

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
    /** `note`: what the reader wrote about this page or book; it shows in the feed. */
    mutationFn: ({
      id,
      startedAt,
      finishedAt,
      ...patch
    }: UpdateShelfEntryInput & { id: string; note?: UpdateNoteInput }) =>
      convex.mutation(api.shelves.update, {
        id: id as Id<"shelfEntries">,
        ...patch,
        ...(startedAt !== undefined && { startedAt: toMs(startedAt) }),
        ...(finishedAt !== undefined && { finishedAt: toMs(finishedAt) }),
      }),
    onMutate: ({ id, status, currentPage, rating, pageCount }) => {
      const patch = {
        ...(status !== undefined && { status }),
        ...(currentPage !== undefined && { currentPage }),
        ...(rating !== undefined && { rating }),
      };
      return patchQueries<ShelfList>(shelves, (data) => ({
        ...data,
        items: data.items.map((item) => {
          if (item.entry.id !== id) return item;
          const entry = { ...item.entry, ...patch };
          // Cleared: only the server knows the book's own pages (the row shows the edition's).
          if (pageCount === undefined || pageCount === null) {
            return { ...item, entry: pageCount === null ? { ...entry, pageCount } : entry };
          }
          entry.currentPage = Math.min(entry.currentPage, pageCount);
          return { entry: { ...entry, pageCount }, book: { ...item.book, pageCount } };
        }),
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
