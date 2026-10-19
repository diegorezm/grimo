import type { UpdateProfileInput } from "@grimo/core";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";

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

export function useUpdateMe() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
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

/** Follow/unfollow, reflected on the reader page immediately (rolled back on error). */
export function useToggleFollow(username: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const key = queryKeys.reader(username);
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
    onMutate: async ({ follow }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReaderPage>(key);
      if (previous && previous.isFollowing !== follow) {
        queryClient.setQueryData<ReaderPage>(key, {
          ...previous,
          isFollowing: follow,
          profile: {
            ...previous.profile,
            followers: previous.profile.followers + (follow ? 1 : -1),
          },
        });
      }
      return () => queryClient.setQueryData(key, previous);
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]),
  });
}
