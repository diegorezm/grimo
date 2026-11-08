import { api, type Id } from "@grimo/backend";
import { EMPTY_SHELF_FILTER, type ShelfFilter, toggleFilter } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { create } from "zustand";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

/**
 * One shelf, many views: personal tags, the shelf's filter (status, genre, tag), the select mode
 * to tag many books at once, and named saved shelves. See `@grimo/core` shelves/filters.
 */

type ShelfList = FunctionReturnType<typeof api.shelves.list>;
export type ShelfTag = FunctionReturnType<typeof api.shelfFilters.tags>["items"][number];
export type SavedShelf = FunctionReturnType<typeof api.shelfFilters.savedShelves>["items"][number];
export type ProfileSavedShelf = FunctionReturnType<
  typeof api.shelfFilters.profileShelves
>["items"][number];

const shelves = [convexQueryPrefix(api.shelves.list)];

export function shelfTagsQuery() {
  return convexQuery(api.shelfFilters.tags, {}, "required");
}

export function useShelfTags() {
  return useQuery(shelfTagsQuery());
}

export function useCreateTag() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (name: string) => convex.mutation(api.shelfFilters.createTag, { name }),
  });
}

export function useRenameTag() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      convex.mutation(api.shelfFilters.renameTag, input),
  });
}

export function useRemoveTag() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (id: string) => convex.mutation(api.shelfFilters.removeTag, { id }),
  });
}

/** Tags (or untags) several books at once; the shelf updates before the server answers. */
export function useSetTag() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { tagId: string; entryIds: string[]; on: boolean }) =>
      convex.mutation(api.shelfFilters.setTag, {
        ...input,
        entryIds: input.entryIds as Id<"shelfEntries">[],
      }),
    onMutate: ({ tagId, entryIds, on }) =>
      patchQueries<ShelfList>(shelves, (data) => ({
        ...data,
        items: data.items.map((item) => {
          if (!entryIds.includes(item.entry.id)) return item;
          const without = item.entry.tagIds.filter((id) => id !== tagId);
          return { ...item, entry: { ...item.entry, tagIds: on ? [...without, tagId] : without } };
        }),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export function savedShelvesQuery() {
  return convexQuery(api.shelfFilters.savedShelves, {}, "required");
}

export function useSavedShelves() {
  return useQuery(savedShelvesQuery());
}

export function useSaveShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    /** Validated with `savedShelfSchema` on the server (genres too). */
    mutationFn: (input: { id?: string; name: string; filter: ShelfFilter; isPublic: boolean }) =>
      convex.mutation(api.shelfFilters.saveShelf, input),
  });
}

export function useRemoveSavedShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (id: string) => convex.mutation(api.shelfFilters.removeSavedShelf, { id }),
  });
}

/** A reader's saved shelves as rows of covers (public ones, or all of them on your own). */
export function profileShelvesQuery(username: string) {
  return convexQuery(api.shelfFilters.profileShelves, { username }, "optional");
}

export function useProfileShelves(username: string) {
  return useQuery(profileShelvesQuery(username));
}

interface ShelfFilterState {
  filter: ShelfFilter;
  /** The saved shelf the filter came from, if any (to update it instead of making another). */
  savedShelfId: string | null;
  toggle: <K extends keyof ShelfFilter>(key: K, value: ShelfFilter[K][number]) => void;
  apply: (filter: ShelfFilter, savedShelfId?: string | null) => void;
  clear: () => void;
  /** Select mode: the books picked to tag at once. */
  selecting: boolean;
  selected: string[];
  setSelecting: (selecting: boolean) => void;
  toggleSelected: (entryId: string) => void;
  selectAll: (entryIds: string[]) => void;
}

/** Client-only state of the shelf screen (web and mobile). */
export const useShelfFilterStore = create<ShelfFilterState>((set) => ({
  filter: EMPTY_SHELF_FILTER,
  savedShelfId: null,
  toggle: (key, value) =>
    set((state) => ({ filter: toggleFilter(state.filter, key, value), savedShelfId: null })),
  apply: (filter, savedShelfId = null) => set({ filter, savedShelfId }),
  clear: () => set({ filter: EMPTY_SHELF_FILTER, savedShelfId: null }),
  selecting: false,
  selected: [],
  setSelecting: (selecting) => set({ selecting, selected: [] }),
  toggleSelected: (entryId) =>
    set((state) => ({
      selected: state.selected.includes(entryId)
        ? state.selected.filter((id) => id !== entryId)
        : [...state.selected, entryId],
    })),
  selectAll: (entryIds) => set({ selected: entryIds }),
}));
