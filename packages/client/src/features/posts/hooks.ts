import { api, type Id } from "@grimo/backend";
import type { CreatePostInput } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

export type PostDetail = FunctionReturnType<typeof api.posts.get>;

export function postQuery(id: string) {
  return convexQuery(api.posts.get, { id }, "optional");
}

export function usePost(id: string) {
  return useQuery(postQuery(id));
}

export function useCreatePost() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: CreatePostInput) =>
      convex.mutation(api.posts.create, {
        ...input,
        bookId: input.bookId as Id<"books"> | null,
      }),
  });
}

type PostList = {
  items: { post: { id: string; likedByMe: boolean; likeCount: number } | null }[];
};

/** Like/unlike: the heart and count change instantly in every list (rolled back on error). */
export function useToggleLike() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ postId, like }: { postId: string; like: boolean }) =>
      convex.mutation(api.posts.setLiked, { postId: postId as Id<"posts">, like }),
    // The post can be in the feed and on its author's page.
    onMutate: ({ postId, like }) =>
      patchQueries<PostList>(
        [convexQueryPrefix(api.feed.list), convexQueryPrefix(api.users.activity)],
        (data) => likeInList(data, postId, like),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

function likeInList<T extends PostList>(data: T, postId: string, like: boolean): T {
  return {
    ...data,
    items: data.items.map((item) =>
      item.post?.id === postId && item.post.likedByMe !== like
        ? {
            ...item,
            post: {
              ...item.post,
              likedByMe: like,
              likeCount: item.post.likeCount + (like ? 1 : -1),
            },
          }
        : item,
    ),
  };
}

export function useAddComment(postId: string) {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (body: string) =>
      convex.mutation(api.posts.comment, { postId: postId as Id<"posts">, body }),
  });
}
