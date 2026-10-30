import { api, type Id } from "@grimo/backend";
import type { ShelfStatus } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import { PAGE_SIZE } from "../../lib/query";

export type FeedPage = FunctionReturnType<typeof api.feed.list>;
export type FeedItem = FeedPage["items"][number];

/** "Seguindo" (you + the people you follow) or "Comunidade" (everyone on Grimo). */
export type FeedTab = "following" | "community";

const feedFunctions = { following: api.feed.list, community: api.feed.community } as const;

/** First page of the feed (route loaders prefetch it). */
export function feedQuery(tab: FeedTab = "following") {
  return convexQuery(feedFunctions[tab], { limit: PAGE_SIZE }, "required");
}

/** Newest first, live: new activity shows up by itself. */
export function useFeed(tab: FeedTab = "following") {
  return useGrowingList(feedFunctions[tab], {}, "required");
}

/** Just the newest items (dashboard previews), sharing the feed's first page in the cache. */
export function useFeedPreview() {
  return useQuery(feedQuery());
}

/** Every list of feed items: both feed tabs and a reader's page. */
export const feedLists = () => [
  convexQueryPrefix(api.feed.list),
  convexQueryPrefix(api.feed.community),
  convexQueryPrefix(api.users.activity),
];

type BookList = {
  items: { book: { openLibraryId: string } | null; reading: { viewerStatus: unknown } | null }[];
};

/**
 * "Quero ler" right from a feed card: the book goes to the shelf and every card about it says
 * so at once (rolled back on error).
 */
export function useShelveFromFeed() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ book, status }: { book: FeedBook; status: ShelfStatus }) =>
      convex.mutation(api.shelves.add, {
        book: {
          openLibraryId: book.openLibraryId,
          title: book.title,
          authors: book.authors,
          coverUrl: book.coverUrl,
          pageCount: null,
          publishedYear: null,
          genres: [],
        },
        status,
      }),
    onMutate: ({ book, status }) =>
      patchQueries<BookList>(feedLists(), (data) => ({
        ...data,
        items: data.items.map((item) =>
          item.book?.openLibraryId === book.openLibraryId && item.reading
            ? { ...item, reading: { ...item.reading, viewerStatus: status } }
            : item,
        ),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

type FeedBook = NonNullable<FeedItem["book"]>;

type ReactionList = { items: FeedItem[] };

/**
 * Like or unlike any update in the feed (not only posts). The heart changes at once in every
 * list; the update's post is made by the server on the first like.
 */
export function useToggleUpdateLike() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ activityId, like }: { activityId: string; like: boolean }) =>
      convex.mutation(api.posts.setActivityLiked, {
        activityId: activityId as Id<"activities">,
        like,
      }),
    onMutate: ({ activityId, like }) =>
      patchQueries<ReactionList>(feedLists(), (data) => ({
        ...data,
        items: data.items.map((item) => {
          if (item.id !== activityId || Boolean(item.post?.likedByMe) === like) return item;
          // Until the server answers, an update nobody reacted to gets a stand-in post (no id).
          const post = item.post ?? {
            id: "" as Id<"posts">,
            kind: "update" as const,
            body: "",
            rating: null,
            hasSpoilers: false,
            page: null,
            createdAt: item.createdAt,
            likeCount: 0,
            commentCount: 0,
            likedByMe: false,
          };
          return {
            ...item,
            post: { ...post, likedByMe: like, likeCount: post.likeCount + (like ? 1 : -1) },
          };
        }),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** The post to open for commenting on an update (the server makes it if needed). */
export function useUpdateThread() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (activityId: string) =>
      convex.mutation(api.posts.activityPost, { activityId: activityId as Id<"activities"> }),
  });
}
