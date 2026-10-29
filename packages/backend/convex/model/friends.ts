import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { authorOf } from "./readers";
import { isHidden } from "./safety";
import { bookView } from "./shelves";

/** People read for "amigos querem ler" (the earliest follows, like the feed). */
const MAX_FRIENDS = 100;
/** "Quero ler" entries read per friend for the suggestions. */
const WANTS_PER_FRIEND = 30;

/** Readers `viewerId` follows who can be shown (blocks already end follows). */
async function friendsOf(ctx: QueryCtx, viewerId: Id<"users">) {
  const follows = await ctx.db
    .query("follows")
    .withIndex("by_follower_following", (q) => q.eq("followerId", viewerId))
    .take(MAX_FRIENDS);
  const users = await Promise.all(follows.map((follow) => ctx.db.get(follow.followingId)));
  return users.filter((user): user is Doc<"users"> => user !== null && !isHidden(user));
}

/** Friends with `bookId` on their "Quero ler" shelf, most recently added first. */
export async function friendsWantingBook(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  bookId: Id<"books">,
) {
  const friends = await friendsOf(ctx, viewerId);
  const entries = await Promise.all(
    friends.map((friend) =>
      ctx.db
        .query("shelfEntries")
        .withIndex("by_user_book", (q) => q.eq("userId", friend._id).eq("bookId", bookId))
        .unique(),
    ),
  );
  return friends
    .map((friend, i) => ({ friend, entry: entries[i] }))
    .filter(({ entry }) => entry?.status === "want_to_read")
    .sort((a, b) => b.entry!.updatedAt - a.entry!.updatedAt)
    .map(({ friend }) => authorOf(friend));
}

/**
 * Books that friends want to read, the most wanted first: the way into reading together. Books
 * you are reading or have read are left out; the ones you want too are flagged (`youWant`).
 */
export async function booksFriendsWant(ctx: QueryCtx, viewerId: Id<"users">, limit: number) {
  const [friends, mine] = await Promise.all([
    friendsOf(ctx, viewerId),
    ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", viewerId))
      .collect(),
  ]);
  const myStatus = new Map(mine.map((entry) => [entry.bookId, entry.status]));
  const wanted = new Map<Id<"books">, { friends: Doc<"users">[]; latest: number }>();
  const shelves = await Promise.all(
    friends.map((friend) =>
      ctx.db
        .query("shelfEntries")
        .withIndex("by_user_status_updated", (q) =>
          q.eq("userId", friend._id).eq("status", "want_to_read"),
        )
        .order("desc")
        .take(WANTS_PER_FRIEND),
    ),
  );
  shelves.forEach((entries, i) => {
    for (const entry of entries) {
      const status = myStatus.get(entry.bookId);
      if (status && status !== "want_to_read") continue;
      const row = wanted.get(entry.bookId) ?? { friends: [], latest: 0 };
      row.friends.push(friends[i]!);
      row.latest = Math.max(row.latest, entry.updatedAt);
      wanted.set(entry.bookId, row);
    }
  });
  const ranked = [...wanted.entries()]
    .sort(([, a], [, b]) => b.friends.length - a.friends.length || b.latest - a.latest)
    .slice(0, limit);
  const rows = await Promise.all(
    ranked.map(async ([bookId, row]) => {
      const book = await ctx.db.get(bookId);
      return book
        ? {
            book: bookView(book),
            friends: row.friends.map(authorOf),
            youWant: myStatus.get(bookId) === "want_to_read",
          }
        : null;
    }),
  );
  return rows.filter((row) => row !== null);
}
