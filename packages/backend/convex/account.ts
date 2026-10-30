import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id, TableNames } from "./_generated/dataModel";
import { internalMutation, type MutationCtx, query } from "./_generated/server";
import { recordBookCounters } from "./model/bookStats";
import { leaveGroup } from "./model/groups";
import { requireViewer } from "./model/readers";

/**
 * Everything Grimo keeps about the signed-in reader, as plain JSON (LGPD art. 18: access and
 * portability). The apps save it as a file. Reads every row of the reader: fine at today's sizes.
 */
export const exportData = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const userId = viewer._id;
    const identity = await ctx.auth.getUserIdentity();
    const [
      goals,
      entries,
      logs,
      posts,
      comments,
      likes,
      following,
      followers,
      blocks,
      consents,
      notifications,
      memberships,
      groupMessages,
      imports,
      booksAdded,
      moderatorInvites,
    ] = await Promise.all([
      ctx.db
        .query("readingGoals")
        .withIndex("by_user_year", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("shelfEntries")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("readingLogs")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect(),
      ctx.db
        .query("postComments")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect(),
      ctx.db
        .query("postLikes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", userId))
        .collect(),
      ctx.db
        .query("blocks")
        .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", userId))
        .collect(),
      ctx.db
        .query("legalAcceptances")
        .withIndex("by_user_document", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("notifications")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("groupMessages")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect(),
      ctx.db
        .query("imports")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("books")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
        .collect(),
      ctx.db
        .query("moderatorInvites")
        .withIndex("by_user_status", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const books = new Map<Id<"books">, Doc<"books"> | null>();
    const bookTitle = async (id: Id<"books"> | null) => {
      if (!id) return null;
      if (!books.has(id)) books.set(id, await ctx.db.get(id));
      return books.get(id)?.title ?? null;
    };
    const username = async (id: Id<"users">) => (await ctx.db.get(id))?.username ?? null;
    const date = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
    const groupBook = async (id: Id<"groups">) => bookTitle((await ctx.db.get(id))?.bookId ?? null);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        email: identity?.email ?? null,
        createdAt: date(viewer._creationTime),
        timeZone: viewer.timeZone ?? null,
        ageConfirmedAt: date(viewer.ageConfirmedAt ?? null),
      },
      profile: {
        name: viewer.name,
        username: viewer.username,
        image: viewer.image,
        bio: viewer.bio,
        favoriteGenres: viewer.favoriteGenres,
      },
      moderation: {
        role: viewer.role ?? null,
        invites: moderatorInvites.map((invite) => ({
          status: invite.status,
          invitedAt: date(invite.createdAt),
          expiresAt: date(invite.expiresAt),
          respondedAt: date(invite.respondedAt),
        })),
      },
      readingGoals: goals.map((goal) => ({ year: goal.year, target: goal.target })),
      shelf: await Promise.all(
        entries.map(async (entry) => ({
          book: await bookTitle(entry.bookId),
          status: entry.status,
          currentPage: entry.currentPage,
          editionPages: entry.pageCount ?? null,
          rating: entry.rating,
          startedAt: date(entry.startedAt),
          finishedAt: date(entry.finishedAt),
        })),
      ),
      readingLog: await Promise.all(
        logs.map(async (log) => ({
          book: await bookTitle((await ctx.db.get(log.shelfEntryId))?.bookId ?? null),
          page: log.page,
          pagesRead: log.pagesRead,
          at: date(log.createdAt),
        })),
      ),
      posts: await Promise.all(
        posts.map(async (post) => ({
          kind: post.kind,
          book: await bookTitle(post.bookId),
          rating: post.rating,
          body: post.body,
          hasSpoilers: post.hasSpoilers,
          page: post.page ?? null,
          createdAt: date(post._creationTime),
        })),
      ),
      comments: comments.map((comment) => ({
        postId: comment.postId,
        body: comment.body,
        createdAt: date(comment._creationTime),
      })),
      likedPosts: likes.map((like) => like.postId),
      following: await Promise.all(following.map((row) => username(row.followingId))),
      followers: await Promise.all(followers.map((row) => username(row.followerId))),
      blocked: await Promise.all(blocks.map((row) => username(row.blockedId))),
      notifications: await Promise.all(
        notifications.map(async (row) => ({
          kind: row.kind,
          from: await username(row.actorId),
          postId: row.postId,
          at: date(row.createdAt),
          readAt: date(row.readAt),
        })),
      ),
      readingGroups: await Promise.all(
        memberships.map(async (row) => ({
          groupId: row.groupId,
          book: await groupBook(row.groupId),
          joinedAt: date(row.joinedAt),
        })),
      ),
      groupMessages: await Promise.all(
        groupMessages.map(async (row) => ({
          groupId: row.groupId,
          book: await groupBook(row.groupId),
          body: row.body,
          atPercent: row.percent,
          at: date(row.createdAt),
        })),
      ),
      booksAdded: booksAdded.map((book) => ({
        title: book.title,
        authors: book.authors,
        review: book.reviewStatus ?? null,
      })),
      imports: imports.map((row) => ({
        source: row.source,
        at: date(row.createdAt),
        total: row.total,
        added: row.added,
        notFound: row.notFound,
      })),
      legalAcceptances: consents.map((row) => ({
        document: row.document,
        version: row.version,
        acceptedAt: date(row.acceptedAt),
        source: row.source,
      })),
    };
  },
});

/**
 * The Better Auth account is gone (`/delete-user`, see convex/auth.ts): hide the reader at once
 * and erase their data in the background (`purge`).
 */
export async function onAccountDeleted(ctx: MutationCtx, authId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();
  if (!user || user.deletedAt) return;
  await ctx.db.patch(user._id, {
    deletedAt: Date.now(),
    name: "Conta excluída",
    image: null,
    bio: null,
    searchText: "",
  });
  await ctx.scheduler.runAfter(0, internal.account.purge, { userId: user._id, step: 0 });
}

/** Rows deleted per run: well under the transaction limits, even with the counter updates. */
const BATCH = 100;
/** Posts per run: each one also deletes its likes, comments and feed lines. */
const POST_BATCH = 10;

/** Returns whether rows may remain (the step runs again). */
type Step = (ctx: MutationCtx, userId: Id<"users">) => Promise<boolean>;

const decrement = (value: number) => Math.max(0, value - 1);

/**
 * Each step erases (at most `BATCH` of) one kind of the reader's data, fixing the counters of
 * everyone else on the way, and returns how many rows it touched. Order matters: content of
 * others first (counters), then the reader's own rows, then the reader.
 */
const steps: Step[] = [
  // Whom the reader follows.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .take(BATCH);
    for (const row of rows) {
      const other = await ctx.db.get(row.followingId);
      if (other) await ctx.db.patch(other._id, { followers: decrement(other.followers) });
      await ctx.db.delete(row._id);
    }
    return rows.length === BATCH;
  },
  // Who follows the reader (and their "começou a seguir" lines).
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .take(BATCH);
    for (const row of rows) {
      const other = await ctx.db.get(row.followerId);
      if (other) await ctx.db.patch(other._id, { following: decrement(other.following) });
      const lines = await ctx.db
        .query("activities")
        .withIndex("by_actor_target", (q) =>
          q.eq("actorId", row.followerId).eq("targetUserId", userId),
        )
        .collect();
      for (const line of lines) await ctx.db.delete(line._id);
      await ctx.db.delete(row._id);
    }
    return rows.length === BATCH;
  },
  // Likes on any post.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(BATCH);
    for (const row of rows) {
      const post = await ctx.db.get(row.postId);
      if (post) await ctx.db.patch(post._id, { likeCount: decrement(post.likeCount) });
      await ctx.db.delete(row._id);
    }
    return rows.length === BATCH;
  },
  // Comments on any post.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("postComments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .take(BATCH);
    for (const row of rows) {
      const post = await ctx.db.get(row.postId);
      if (post) await ctx.db.patch(post._id, { commentCount: decrement(post.commentCount) });
      await ctx.db.delete(row._id);
    }
    return rows.length === BATCH;
  },
  // The reader's posts, with the likes, comments and feed lines of others on them.
  async (ctx, userId) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .take(POST_BATCH);
    for (const post of posts) {
      const related = await Promise.all([
        ctx.db
          .query("postLikes")
          .withIndex("by_post_user", (q) => q.eq("postId", post._id))
          .collect(),
        ctx.db
          .query("postComments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect(),
        ctx.db
          .query("activities")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect(),
      ]);
      for (const doc of related.flat()) await ctx.db.delete(doc._id);
      await ctx.db.delete(post._id);
    }
    return posts.length === POST_BATCH;
  },
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("activities").withIndex("by_actor_created", (q) => q.eq("actorId", userId)),
    ),
  // Notifications to the reader, and those the reader caused to others.
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("notifications").withIndex("by_user_created", (q) => q.eq("userId", userId)),
    ),
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("notifications").withIndex("by_actor_post", (q) => q.eq("actorId", userId)),
    ),
  // Imports: rows still waiting (an import running when the account went), then the summaries.
  async (ctx, userId) => {
    const jobs = await ctx.db
      .query("imports")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .take(BATCH);
    for (const job of jobs) {
      const rows = await ctx.db
        .query("importRows")
        .withIndex("by_import_index", (q) => q.eq("importId", job._id))
        .take(BATCH);
      for (const row of rows) await ctx.db.delete(row._id);
      if (rows.length < BATCH) await ctx.db.delete(job._id);
      else return true;
    }
    return jobs.length === BATCH;
  },
  // Juntos: the reader's messages, then their seats (a group left empty goes too).
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("groupMessages").withIndex("by_author", (q) => q.eq("authorId", userId)),
    ),
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(POST_BATCH);
    for (const row of rows) {
      const group = await ctx.db.get(row.groupId);
      if (group) await leaveGroup(ctx, group, userId);
      else await ctx.db.delete(row._id);
    }
    return rows.length === POST_BATCH;
  },
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("readingLogs").withIndex("by_user_created", (q) => q.eq("userId", userId)),
    ),
  // Shelf entries: the books they were on lose a reader (and a rating).
  async (ctx, userId) => {
    const entries = await ctx.db
      .query("shelfEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .take(BATCH);
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
      await recordBookCounters(ctx, entry.bookId, entry, null);
    }
    return entries.length === BATCH;
  },
  // Hand-added books: the ones nobody else can see go; approved ones stay, without the author.
  async (ctx, userId) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .take(BATCH);
    for (const book of books) {
      if (book.reviewStatus === "approved") await ctx.db.patch(book._id, { createdBy: undefined });
      else await ctx.db.delete(book._id);
    }
    return books.length === BATCH;
  },
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("readingGoals").withIndex("by_user_year", (q) => q.eq("userId", userId)),
    ),
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("blocks").withIndex("by_blocker_blocked", (q) => q.eq("blockerId", userId)),
    ),
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("blocks").withIndex("by_blocked", (q) => q.eq("blockedId", userId)),
    ),
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("legalAcceptances").withIndex("by_user_document", (q) => q.eq("userId", userId)),
    ),
  // Reports the reader filed stay (moderation record), without the reporter.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("reports")
      .withIndex("by_reporter_target", (q) => q.eq("reporterId", userId))
      .take(BATCH);
    for (const row of rows) await ctx.db.patch(row._id, { reporterId: null });
    return rows.length === BATCH;
  },
  async (ctx, userId) =>
    deleteAll(
      ctx,
      ctx.db.query("moderatorInvites").withIndex("by_user_status", (q) => q.eq("userId", userId)),
    ),
  // Invites the admin sent stay (moderation record), without the admin.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("moderatorInvites")
      .withIndex("by_invitedBy", (q) => q.eq("invitedBy", userId))
      .take(BATCH);
    for (const row of rows) await ctx.db.patch(row._id, { invitedBy: null });
    return rows.length === BATCH;
  },
  // Moderation history stays, without the moderator or the reader acted on.
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("moderationLog")
      .withIndex("by_actor", (q) => q.eq("actorId", userId))
      .take(BATCH);
    for (const row of rows) await ctx.db.patch(row._id, { actorId: null });
    return rows.length === BATCH;
  },
  async (ctx, userId) => {
    const rows = await ctx.db
      .query("moderationLog")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", userId))
      .take(BATCH);
    for (const row of rows) await ctx.db.patch(row._id, { targetUserId: null });
    return rows.length === BATCH;
  },
];

async function deleteAll(
  ctx: MutationCtx,
  query: { take: (n: number) => Promise<{ _id: Id<TableNames> }[]> },
) {
  const rows = await query.take(BATCH);
  for (const row of rows) await ctx.db.delete(row._id);
  return rows.length === BATCH;
}

/**
 * Erases a deleted reader, one batch per run: a step that filled its batch runs again, one that
 * didn't moves on. After the last step the reader's row goes too.
 */
export const purge = internalMutation({
  args: { userId: v.id("users"), step: v.number() },
  handler: async (ctx, { userId, step }) => {
    const run = steps[step];
    if (!run) {
      if (await ctx.db.get(userId)) await ctx.db.delete(userId);
      return null;
    }
    const more = await run(ctx, userId);
    const next = more ? step : step + 1;
    await ctx.scheduler.runAfter(0, internal.account.purge, { userId, step: next });
    return null;
  },
});
