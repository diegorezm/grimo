import type { CreatePostInput } from "@grimo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys } from "../../lib/query";

export type PostDetail = InferResponseType<ApiClient["posts"][":id"]["$get"], 200>;

export function usePost(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => parseResponse(api.posts[":id"].$get({ param: { id } })),
  });
}

export function useCreatePost() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (json: CreatePostInput) => parseResponse(api.posts.$post({ json })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
  });
}

export function useToggleLike() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      like,
    }: {
      postId: string;
      like: boolean;
    }): Promise<{ liked: boolean }> => {
      const route = api.posts[":id"].like;
      const param = { id: postId };
      return like ? parseResponse(route.$post({ param })) : parseResponse(route.$delete({ param }));
    },
    onSuccess: (_data, { postId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) }),
      ]),
  });
}

export function useAddComment(postId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      parseResponse(api.posts[":id"].comments.$post({ param: { id: postId }, json: { body } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) }),
  });
}
