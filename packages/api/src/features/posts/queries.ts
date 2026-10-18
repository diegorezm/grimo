import { books, postComments, postLikes, posts, user as users } from "@grimo/db";
import { eq, sql } from "drizzle-orm";

/** Columns shared by the feed and post detail. */
export const authorColumns = {
  id: users.id,
  name: users.name,
  username: users.username,
  image: users.image,
};

export const bookColumns = {
  id: books.id,
  title: books.title,
  authors: books.authors,
  coverUrl: books.coverUrl,
};

export const postColumns = (viewerId: string | null) => ({
  id: posts.id,
  kind: posts.kind,
  body: posts.body,
  rating: posts.rating,
  hasSpoilers: posts.hasSpoilers,
  createdAt: posts.createdAt,
  likeCount: sql<number>`(select count(*) from ${postLikes} where ${postLikes.postId} = ${posts.id})`,
  commentCount: sql<number>`(select count(*) from ${postComments} where ${postComments.postId} = ${posts.id})`,
  likedByMe:
    sql<boolean>`exists(select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId ?? ""})`.mapWith(
      Boolean,
    ),
});

export const joinAuthor = eq(users.id, posts.authorId);
export const joinBook = eq(books.id, posts.bookId);
