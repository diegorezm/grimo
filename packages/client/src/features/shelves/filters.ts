import { api } from "@grimo/backend";
import { EMPTY_SHELF_FILTER, type ShelfFilter, toggleFilter } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { create } from "zustand";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

/**
 * The shelves a reader makes ("Física", "Kindle"): create, rename, share, duplicate, delete,
 * and put books on them (or take them off, or move them) in one go. Status and genre are the
 * filters inside a shelf. See `@grimo/core` shelves/filters.
 */

type ShelfList = FunctionReturnType<typeof api.shelves.list>;
type MyShelves = FunctionReturnType<typeof api.bookshelves.mine>;
export type MyShelf = MyShelves["items"][number];
export type ProfileShelf = FunctionReturnType<typeof api.bookshelves.profile>["items"][number];

const shelfLists = [convexQueryPrefix(api.shelves.list)];
const myShelvesKey = [convexQueryPrefix(api.bookshelves.mine)];

export function myShelvesQuery() {
  return convexQuery(api.bookshelves.mine, {}, "required");
}

export function useMyShelves() {
  return useQuery(myShelvesQuery());
}

export function profileShelvesQuery(username: string) {
  return convexQuery(api.bookshelves.profile, { username }, "optional");
}

/** A reader's shelves as rows of covers (public ones, or all of them on your own profile). */
export function useProfileShelves(username: string) {
  return useQuery(profileShelvesQuery(username));
}

export function useCreateShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: { name: string; isPublic: boolean; entryIds?: string[] }) =>
      convex.mutation(api.bookshelves.create, input),
  });
}

export function useRenameShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      convex.mutation(api.bookshelves.rename, input),
  });
}

export function useSetShelfPublic() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { id: string; isPublic: boolean }) =>
      convex.mutation(api.bookshelves.setPublic, input),
    onMutate: ({ id, isPublic }) =>
      patchQueries<MyShelves>(myShelvesKey, (data) => ({
        ...data,
        items: data.items.map((shelf) => (shelf.id === id ? { ...shelf, isPublic } : shelf)),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export function useRemoveShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (id: string) => convex.mutation(api.bookshelves.remove, { id }),
  });
}

export function useDuplicateShelf() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: { id: string; name?: string }) =>
      convex.mutation(api.bookshelves.duplicate, input),
  });
}

/** Moves the shelf's books in the cached shelf list at once (the counts follow the server). */
function patchBooks(entryIds: string[], change: (shelves: string[]) => string[]) {
  return (data: ShelfList): ShelfList => ({
    ...data,
    items: data.items.map((item) =>
      entryIds.includes(item.entry.id)
        ? { ...item, entry: { ...item.entry, tagIds: change(item.entry.tagIds) } }
        : item,
    ),
  });
}

/** Puts books on a shelf or takes them off. */
export function useSetShelfBooks() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { shelfId: string; entryIds: string[]; on: boolean }) =>
      convex.mutation(api.bookshelves.setBooks, input),
    onMutate: ({ shelfId, entryIds, on }) =>
      patchQueries<ShelfList>(
        shelfLists,
        patchBooks(entryIds, (shelves) => {
          const without = shelves.filter((id) => id !== shelfId);
          return on ? [...without, shelfId] : without;
        }),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export function useMoveBooks() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { fromId: string; toId: string; entryIds: string[] }) =>
      convex.mutation(api.bookshelves.move, input),
    onMutate: ({ fromId, toId, entryIds }) =>
      patchQueries<ShelfList>(
        shelfLists,
        patchBooks(entryIds, (shelves) => [
          ...shelves.filter((id) => id !== fromId && id !== toId),
          toId,
        ]),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Status and genre: the filters inside a shelf. */
export type ShelfViewFilter = Pick<ShelfFilter, "statuses" | "genres">;

interface ShelfScreenState {
  /** The shelf shown: one you made, or null for "Todos os meus livros". */
  shelfId: string | null;
  filter: ShelfViewFilter;
  openShelf: (shelfId: string | null) => void;
  toggle: <K extends keyof ShelfViewFilter>(key: K, value: ShelfViewFilter[K][number]) => void;
  /** Opens every book filtered by this status (the dashboard's tiles). */
  showStatus: (status: ShelfFilter["statuses"][number]) => void;
  clearFilter: () => void;
  /** Select mode: the books picked to act on at once. */
  selecting: boolean;
  selected: string[];
  /** "Escolher livros" for an empty shelf: picking from every book to add to this one. */
  pickingFor: string | null;
  setSelecting: (selecting: boolean) => void;
  pickBooksFor: (shelfId: string) => void;
  toggleSelected: (entryId: string) => void;
  selectAll: (entryIds: string[]) => void;
}

const NO_FILTER: ShelfViewFilter = { statuses: [], genres: [] };

/** Client-only state of the shelf screen (web and mobile). */
export const useShelfScreenStore = create<ShelfScreenState>((set) => ({
  shelfId: null,
  filter: NO_FILTER,
  openShelf: (shelfId) =>
    set({ shelfId, filter: NO_FILTER, selecting: false, selected: [], pickingFor: null }),
  toggle: (key, value) =>
    set((state) => ({
      filter: toggleFilter({ ...EMPTY_SHELF_FILTER, ...state.filter }, key, value),
    })),
  showStatus: (status) =>
    set({ shelfId: null, filter: { statuses: [status], genres: [] }, selecting: false }),
  clearFilter: () => set({ filter: NO_FILTER }),
  selecting: false,
  selected: [],
  pickingFor: null,
  setSelecting: (selecting) => set({ selecting, selected: [], pickingFor: null }),
  pickBooksFor: (shelfId) =>
    set({ shelfId: null, filter: NO_FILTER, selecting: true, selected: [], pickingFor: shelfId }),
  toggleSelected: (entryId) =>
    set((state) => ({
      selected: state.selected.includes(entryId)
        ? state.selected.filter((id) => id !== entryId)
        : [...state.selected, entryId],
    })),
  selectAll: (entryIds) => set({ selected: entryIds }),
}));
