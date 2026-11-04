import { api, type Id } from "@grimo/backend";
import type { BookInput, ListInput } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

export type ListDetail = NonNullable<FunctionReturnType<typeof api.lists.get>>;
export type ListTile = FunctionReturnType<typeof api.lists.byUser>["items"][number];
export type MyList = FunctionReturnType<typeof api.lists.mine>["items"][number];

const listId = (id: string) => id as Id<"lists">;

/** A reader's lists (public; the profile shows them). */
export function readerListsQuery(username: string) {
  return convexQuery(api.lists.byUser, { username }, "optional");
}

export function useReaderLists(username: string) {
  return useQuery(readerListsQuery(username));
}

/** One list with its books; null when it's gone (route loaders prefetch it). */
export function listQuery(id: string) {
  return convexQuery(api.lists.get, { id }, "optional");
}

export function useList(id: string) {
  return useQuery(listQuery(id));
}

/** My lists, with whether `openLibraryId` is in each ("Adicionar a uma lista"). */
export function useMyLists(openLibraryId?: string) {
  return useQuery(convexQuery(api.lists.mine, openLibraryId ? { openLibraryId } : {}, "required"));
}

export function useCreateList() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: ListInput) => convex.mutation(api.lists.create, input),
  });
}

export function useUpdateList() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ id, ...input }: ListInput & { id: string }) =>
      convex.mutation(api.lists.update, { id: listId(id), ...input }),
    onMutate: ({ id, title, description }) =>
      patchQueries<ListDetail | null>([convexQueryPrefix(api.lists.get)], (data) =>
        data && data.id === id
          ? { ...data, title: title.trim(), description: (description ?? "").trim() }
          : data,
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export function useRemoveList() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (id: string) => convex.mutation(api.lists.remove, { id: listId(id) }),
  });
}

type MyLists = { items: MyList[] };

/** Puts a book on a list; the picker checks it at once. */
export function useAddToList() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ id, book, note }: { id: string; book: BookInput; note?: string }) =>
      convex.mutation(api.lists.addBook, { listId: listId(id), book, note }),
    onMutate: ({ id, book }) =>
      patchQueries<MyLists>([convexQueryPrefix(api.lists.mine)], (data) => ({
        ...data,
        items: data.items.map((list) =>
          list.id === id && !list.hasBook
            ? { ...list, hasBook: true, itemCount: list.itemCount + 1 }
            : list,
        ),
      })).then((rollback) => ({ rollback, openLibraryId: book.openLibraryId })),
    onError: (_error, _input, context) => context?.rollback(),
  });
}

/** Takes a book off a list, from the list page and the picker at once. */
export function useRemoveFromList() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ id, openLibraryId }: { id: string; openLibraryId: string }) =>
      convex.mutation(api.lists.removeBook, { listId: listId(id), openLibraryId }),
    onMutate: async ({ id, openLibraryId }) => {
      const undoList = await patchQueries<ListDetail | null>(
        [convexQueryPrefix(api.lists.get)],
        (data) =>
          data && data.id === id
            ? {
                ...data,
                items: data.items.filter((item) => item.book.openLibraryId !== openLibraryId),
              }
            : data,
      );
      const undoMine = await patchQueries<MyLists>([convexQueryPrefix(api.lists.mine)], (data) => ({
        ...data,
        items: data.items.map((list) =>
          list.id === id && list.hasBook
            ? { ...list, hasBook: false, itemCount: Math.max(0, list.itemCount - 1) }
            : list,
        ),
      }));
      return () => {
        undoList();
        undoMine();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}
