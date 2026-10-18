import type { UpdateProfileInput } from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export type Profile = InferResponseType<ApiClient["me"]["$get"], 200>;
export type ReaderPage = InferResponseType<ApiClient["users"][":username"]["$get"], 200>;

export function useMe(options: { enabled?: boolean } = {}) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => parseResponse(api.me.$get()),
    ...options,
  });
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
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.reader(username),
    queryFn: () => parseResponse(api.users[":username"].$get({ param: { username } })),
    enabled: Boolean(username),
  });
}

export function useToggleFollow(username: string) {
  const api = useApi();
  const queryClient = useQueryClient();
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reader(username) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
      ]),
  });
}
