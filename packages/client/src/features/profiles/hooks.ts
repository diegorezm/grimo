import type { UpdateProfileInput } from "@grimo/core";
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { PAGE_SIZE, parseResponse, queryKeys, staleTimes } from "../../lib/query";

export type Profile = InferResponseType<ApiClient["me"]["$get"], 200>;
export type ReaderPage = InferResponseType<ApiClient["users"][":username"]["$get"], 200>;

export function meQuery(api: ApiClient) {
  return queryOptions({
    queryKey: queryKeys.me,
    queryFn: () => parseResponse(api.me.$get()),
    staleTime: staleTimes.own,
  });
}

export function readerQuery(api: ApiClient, username: string) {
  return queryOptions({
    queryKey: queryKeys.reader(username),
    queryFn: () => parseResponse(api.users[":username"].$get({ param: { username } })),
    staleTime: staleTimes.social,
    enabled: Boolean(username),
  });
}

export function useMe(options: { enabled?: boolean } = {}) {
  return useQuery({ ...meQuery(useApi()), ...options });
}

/** Key of the profile update mutation (lets a pinned "Salvar" button show progress). */
export const updateMeMutationKey = ["me", "update"] as const;

export function useUpdateMe() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateMeMutationKey,
    mutationFn: (json: UpdateProfileInput) => parseResponse(api.me.$patch({ json })),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.me, profile);
      return queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useReader(username: string) {
  return useQuery(readerQuery(useApi(), username));
}

export type ReaderActivityPage = InferResponseType<
  ApiClient["users"][":username"]["activity"]["$get"],
  200
>;

/** A reader's own activity (posts, progress, finished books…), newest first. */
export function readerActivityQuery(api: ApiClient, username: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.readerActivity(username),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      parseResponse(
        api.users[":username"].activity.$get({
          param: { username },
          query: { cursor: pageParam, limit: PAGE_SIZE },
        }),
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: staleTimes.social,
  });
}

export function useReaderActivity(username: string) {
  return useInfiniteQuery(readerActivityQuery(useApi(), username));
}

export type ConnectionKind = "followers" | "following";
export type ReaderCard = InferResponseType<
  ApiClient["users"][":username"]["followers"]["$get"],
  200
>["items"][number];

/** Who follows a reader, or whom they follow. */
export function readerConnectionsQuery(api: ApiClient, username: string, kind: ConnectionKind) {
  return infiniteQueryOptions({
    queryKey: queryKeys.readerConnections(username, kind),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const input = { param: { username }, query: { cursor: pageParam, limit: PAGE_SIZE } };
      const route = api.users[":username"];
      return parseResponse(
        kind === "followers" ? route.followers.$get(input) : route.following.$get(input),
      );
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: staleTimes.social,
  });
}

export function useReaderConnections(username: string, kind: ConnectionKind) {
  return useInfiniteQuery(readerConnectionsQuery(useApi(), username, kind));
}

/** Readers whose name or @username contains `q`, a page at a time. */
export function readerSearchQuery(api: ApiClient, q: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.readerSearch(q),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      parseResponse(api.users.$get({ query: { q, cursor: pageParam, limit: PAGE_SIZE } })),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: staleTimes.social,
    enabled: q.trim().length > 0,
  });
}

export function useReaderSearch(q: string) {
  return useInfiniteQuery(readerSearchQuery(useApi(), q));
}

export type ReaderSuggestion = InferResponseType<
  ApiClient["users"]["suggestions"]["$get"],
  200
>["items"][number];

/** Everyone you don't follow yet, best matches first, a page at a time. */
export function readerSuggestionsQuery(api: ApiClient) {
  return infiniteQueryOptions({
    queryKey: queryKeys.readerSuggestions,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      parseResponse(api.users.suggestions.$get({ query: { cursor: pageParam, limit: PAGE_SIZE } })),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: staleTimes.social,
  });
}

export function useReaderSuggestions() {
  return useInfiniteQuery(readerSuggestionsQuery(useApi()));
}

type FollowState = { id: string; isFollowing: boolean; followers: number };

/** Sets `isFollowing` (and the follower count) of `userId` wherever it appears in `data`. */
function patchFollow(data: unknown, userId: string, follow: boolean): unknown {
  if (!data || typeof data !== "object") return data;
  const patch = <T extends FollowState>(reader: T): T =>
    reader.id === userId && reader.isFollowing !== follow
      ? { ...reader, isFollowing: follow, followers: reader.followers + (follow ? 1 : -1) }
      : reader;

  if ("pages" in data && Array.isArray(data.pages)) {
    return { ...data, pages: data.pages.map((page) => patchFollow(page, userId, follow)) };
  }
  if ("items" in data && Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map((item: FollowState) => ("isFollowing" in item ? patch(item) : item)),
    };
  }
  if ("profile" in data && "isFollowing" in data) {
    const page = data as ReaderPage;
    if (page.profile.id !== userId || page.isFollowing === follow) return page;
    return {
      ...page,
      isFollowing: follow,
      profile: { ...page.profile, followers: page.profile.followers + (follow ? 1 : -1) },
    };
  }
  return data;
}

/**
 * Follow/unfollow from anywhere (profile, search, suggestions, follower lists): every cached
 * reader list and page shows the new state immediately (rolled back on error).
 */
export function useToggleFollow() {
  const api = useApi();
  const queryClient = useQueryClient();
  const readers = { queryKey: queryKeys.allReaders };
  return useMutation({
    mutationFn: ({
      userId,
      follow,
    }: {
      userId: string;
      follow: boolean;
    }): Promise<{ following: boolean }> => {
      const route = api.users[":id"].follow;
      const param = { id: userId };
      return follow
        ? parseResponse(route.$post({ param }))
        : parseResponse(route.$delete({ param }));
    },
    onMutate: async ({ userId, follow }) => {
      await queryClient.cancelQueries(readers);
      const previous = queryClient.getQueriesData(readers);
      queryClient.setQueriesData(readers, (data) => patchFollow(data, userId, follow));
      return () => {
        for (const [key, data] of previous) queryClient.setQueryData(key, data);
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: () =>
      Promise.all([
        // Suggestions and search keep the reader in place (now "Seguindo") until they go stale.
        queryClient.invalidateQueries({
          queryKey: queryKeys.allReaders,
          predicate: ({ queryKey }) => queryKey[1] !== "suggestions" && queryKey[1] !== "search",
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]),
  });
}
