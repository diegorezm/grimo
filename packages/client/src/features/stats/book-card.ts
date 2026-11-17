import { type BookStoryData, buildFinishedCard, buildQuoteCard, editionPages } from "@grimo/core";
import { useBook } from "../books/hooks";
import { usePost } from "../posts/hooks";
import { useMe } from "../profiles/hooks";
import { useCardData } from "./card-data";

/** "Terminei de ler" for a book on your "Lidos" shelf; null until it is there. */
export function useFinishedCard(openLibraryId: string): BookStoryData | null {
  const detail = useBook(openLibraryId).data;
  const me = useMe().data;
  const entry = detail?.entry;
  const finishYear =
    entry?.finishedAt != null
      ? new Date(entry.finishedAt).getUTCFullYear()
      : new Date().getUTCFullYear();
  const yearData = useCardData({ kind: "year", year: finishYear });

  if (!detail || entry?.status !== "read") return null;

  const myReview = me ? detail.reviews.find((review) => review.author.id === me.id) : null;
  const yearRank =
    yearData && yearData.booksRead > 0
      ? {
          index: yearData.booksRead,
          year: finishYear,
          target: yearData.goal?.target ?? null,
        }
      : null;

  return buildFinishedCard(
    detail.book,
    entry,
    editionPages(entry.pageCount, detail.book.pageCount),
    me?.username ?? null,
    {
      genres: detail.book.genres,
      publishedYear: detail.book.publishedYear,
      feelings: entry.feelings,
      pastReads: entry.pastReads,
      reviewBody: myReview?.body ?? null,
      diaryMarks: detail.diary.marks,
      yearRank,
    },
  );
}

/** The card of a quote (yours or anyone's: the card says who shares it, not who wrote it). */
export function useQuoteCard(postId: string): BookStoryData | null {
  const post = usePost(postId).data?.post;
  const username = useMe().data?.username ?? null;
  if (post?.kind !== "quote" || !post.book) return null;
  return buildQuoteCard(post.book, { body: post.body, page: post.page }, username);
}
