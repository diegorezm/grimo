import type { CreatePostInput } from "@grimo/core";
import {
  type InfiniteData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import type { ApiClient } from "../../lib/api-client";
import { useApi } from "../../lib/api-context";
import { parseResponse, queryKeys, staleTimes } from "../../lib/query";
import type { FeedPage } from "../feed/hooks";

export type PostDetail = InferResponseType<ApiClient["posts"][":id"]["$get"], 200>;

export function postQuery(api: ApiClient, id: string) {
  return queryOptions({
    queryKey: queryKeys.post(id),
    queryFn: () => parseResponse(api.posts[":id"].$get({ param: { id } })),
    staleTime: staleTimes.social,
  });
}

export function usePost(id: string) {
  return useQuery(postQuery(useApi(), id));
}

export function useCreatePost() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (json: CreatePostInput) => parseResponse(api.posts.$post({ json })),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allBooks }),
      ]),
  });
}

/** Like/unlike: the heart and count change instantly in the feed (rolled back on error). */
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
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(queryKeys.feed);
      if (previous) {
        queryClient.setQueryData<InfiniteData<FeedPage>>(queryKeys.feed, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.post?.id === postId && Boolean(item.post.likedByMe) !== like
                ? {
                    ...item,
                    post: {
                      ...item.post,
                      likedByMe: like,
                      likeCount: (item.post.likeCount ?? 0) + (like ? 1 : -1),
                    },
                  }
                : item,
            ),
          })),
        });
      }
      return () => queryClient.setQueryData(queryKeys.feed, previous);
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSettled: (_data, _error, { postId }) =>
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
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
      ]),
  });
}
