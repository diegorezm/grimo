import { type BookStoryData, buildFinishedCard, buildQuoteCard, editionPages } from "@grimo/core";
import { useBook } from "../books/hooks";
import { usePost } from "../posts/hooks";
import { useMe } from "../profiles/hooks";

/** "Terminei de ler" for a book on your "Lidos" shelf; null until it is there. */
export function useFinishedCard(openLibraryId: string): BookStoryData | null {
  const detail = useBook(openLibraryId).data;
  const username = useMe().data?.username ?? null;
  const entry = detail?.entry;
  if (!detail || entry?.status !== "read") return null;
  return buildFinishedCard(
    detail.book,
    entry,
    editionPages(entry.pageCount, detail.book.pageCount),
    username,
  );
}

/** The card of a quote (yours or anyone's: the card says who shares it, not who wrote it). */
export function useQuoteCard(postId: string): BookStoryData | null {
  const post = usePost(postId).data?.post;
  const username = useMe().data?.username ?? null;
  if (post?.kind !== "quote" || !post.book) return null;
  return buildQuoteCard(post.book, { body: post.body, page: post.page }, username);
}
