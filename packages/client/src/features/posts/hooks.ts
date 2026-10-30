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
        [
          convexQueryPrefix(api.feed.list),
          convexQueryPrefix(api.feed.community),
          convexQueryPrefix(api.users.activity),
        ],
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

type CountedList = { items: { post: { id: string; commentCount: number } | null }[] };

/** Lists that show a post's comment count: the feed and a reader's page. */
const countedLists = () => [
  convexQueryPrefix(api.feed.list),
  convexQueryPrefix(api.feed.community),
  convexQueryPrefix(api.users.activity),
];

function commentCountInLists<T extends CountedList>(data: T, postId: string, delta: number): T {
  return {
    ...data,
    items: data.items.map((item) =>
      item.post?.id === postId
        ? {
            ...item,
            post: { ...item.post, commentCount: Math.max(0, item.post.commentCount + delta) },
          }
        : item,
    ),
  };
}

/** The comment shows up for everyone through the post's subscription; the count is instant. */
export function useAddComment(postId: string) {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (body: string) =>
      convex.mutation(api.posts.comment, { postId: postId as Id<"posts">, body }),
    onMutate: () =>
      patchQueries<CountedList>(countedLists(), (data) => commentCountInLists(data, postId, 1)),
    onError: (_error, _body, rollback) => rollback?.(),
  });
}

/** Deletes a comment (yours, or any on your post): gone from the thread and the count at once. */
export function useRemoveComment(postId: string) {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (commentId: string) =>
      convex.mutation(api.posts.removeComment, { id: commentId as Id<"postComments"> }),
    onMutate: async (commentId) => {
      const undoLists = await patchQueries<CountedList>(countedLists(), (data) =>
        commentCountInLists(data, postId, -1),
      );
      const undoThread = await patchQueries<PostDetail>(
        [convexQueryPrefix(api.posts.get)],
        (data) =>
          data.post.id === postId
            ? {
                ...data,
                post: { ...data.post, commentCount: Math.max(0, data.post.commentCount - 1) },
                comments: data.comments.filter((comment) => comment.id !== commentId),
              }
            : data,
      );
      return () => {
        undoLists();
        undoThread();
      };
    },
    onError: (_error, _commentId, rollback) => rollback?.(),
  });
}

/** Deletes your own post (and its likes, comments and feed entries) from every list at once. */
export function useRemovePost() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (postId: string) =>
      convex.mutation(api.posts.remove, { id: postId as Id<"posts"> }),
    onMutate: (postId) =>
      patchQueries<CountedList>(countedLists(), (data) => ({
        ...data,
        items: data.items.filter((item) => item.post?.id !== postId),
      })),
    onError: (_error, _postId, rollback) => rollback?.(),
  });
}
