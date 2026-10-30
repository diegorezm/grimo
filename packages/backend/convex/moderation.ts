import { MAX_SUSPENSION_REASON, type ReportTarget, reportSchema } from "@grimo/core";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { appError, notFound, parse } from "./model/errors";
import {
  deleteComment,
  deletePost,
  logAction,
  reviewBook as reviewBookIn,
} from "./model/moderation";
import { deleteNotificationsBetween } from "./model/notifications";
import { enforceRateLimit } from "./model/rateLimit";
import {
  authorOf,
  canModerate,
  requireAdmin,
  requireStaff,
  requireViewer,
  userByUsername,
} from "./model/readers";
import { isSuspended, MAX_BLOCKS } from "./model/safety";
import { moderationLogAction as logActionKind, reportReason, reportTarget } from "./schema";
import { setFollow } from "./users";

/** Who answers for the reported thing, and a copy of its text (kept if it gets deleted). */
async function reportedContent(ctx: MutationCtx, target: string, targetId: string) {
  if (target === "post") {
    const id = ctx.db.normalizeId("posts", targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (!post) throw notFound("Post");
    return { userId: post.authorId, snapshot: post.body };
  }
  if (target === "comment") {
    const id = ctx.db.normalizeId("postComments", targetId);
    const comment = id ? await ctx.db.get(id) : null;
    if (!comment) throw notFound("Comentário");
    return { userId: comment.authorId, snapshot: comment.body };
  }
  if (target === "message") {
    const id = ctx.db.normalizeId("groupMessages", targetId);
    const message = id ? await ctx.db.get(id) : null;
    if (!message) throw notFound("Mensagem");
    return { userId: message.authorId, snapshot: message.body };
  }
  const id = ctx.db.normalizeId("users", targetId);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) throw notFound("Leitor");
  return { userId: user._id, snapshot: `${user.name} (@${user.username}): ${user.bio ?? ""}` };
}

/**
 * Reports a post, comment or reader to moderation. Reporting the same thing twice keeps one
 * report. The queue is reviewed in the Convex dashboard (`reports`, status "open").
 */
export const report = mutation({
  args: {
    target: reportTarget,
    targetId: v.string(),
    reason: reportReason,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const input = parse(reportSchema, args);
    await enforceRateLimit(ctx, "report", viewer._id);
    const content = await reportedContent(ctx, input.target, input.targetId);
    if (content.userId === viewer._id) {
      throw appError("INVALID", "Você não pode denunciar algo seu.");
    }
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_target", (q) =>
        q.eq("reporterId", viewer._id).eq("target", input.target).eq("targetId", input.targetId),
      )
      .order("desc")
      .first();
    if (existing?.status === "open") return null;
    await ctx.db.insert("reports", {
      reporterId: viewer._id,
      target: input.target,
      targetId: input.targetId,
      targetUserId: content.userId,
      reason: input.reason,
      details: input.details || null,
      snapshot: content.snapshot.slice(0, 5000),
      status: "open",
      createdAt: Date.now(),
      resolvedAt: null,
    });
    return null;
  },
});

/**
 * Blocks (`block: true`) or unblocks a reader. Blocking undoes follows both ways; while it lasts
 * neither can follow, like or comment on the other, and each other's content is hidden.
 */
export const setBlocked = mutation({
  args: { userId: v.id("users"), block: v.boolean() },
  handler: async (ctx, { userId, block }) => {
    const viewer = await requireViewer(ctx);
    if (userId === viewer._id) throw appError("INVALID", "Você não pode bloquear a si mesmo.");
    const target = await ctx.db.get(userId);
    if (!target) throw notFound("Leitor");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id).eq("blockedId", userId))
      .unique();
    if (block && !existing) {
      const count = await ctx.db
        .query("blocks")
        .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id))
        .take(MAX_BLOCKS);
      if (count.length >= MAX_BLOCKS) throw appError("INVALID", "Limite de bloqueios atingido.");
      await setFollow(ctx, viewer, userId, false);
      await setFollow(ctx, target, viewer._id, false);
      await ctx.db.insert("blocks", { blockerId: viewer._id, blockedId: userId });
      await deleteNotificationsBetween(ctx, viewer._id, userId);
    } else if (!block && existing) {
      await ctx.db.delete(existing._id);
    }
    return { blocked: block };
  },
});

/** Readers I blocked (settings, to unblock), newest first. */
export const blocked = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) => q.eq("blockerId", viewer._id))
      .take(MAX_BLOCKS);
    const readers = await Promise.all(rows.map((row) => ctx.db.get(row.blockedId)));
    return {
      items: readers.flatMap((reader) => (reader && !reader.deletedAt ? [authorOf(reader)] : [])),
    };
  },
});

// Moderation tools, run from the Convex dashboard (Functions → moderation) or the CLI:
//   npx convex run moderation:resolve '{"reportId":"…","status":"actioned"}'

/** Closes a report: `actioned` (something was done) or `dismissed`. */
export const resolve = internalMutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("actioned"), v.literal("dismissed")),
  },
  handler: async (ctx, { reportId, status }) => {
    await ctx.db.patch(reportId, { status, resolvedAt: Date.now() });
    return null;
  },
});

/** Removes a reported post, comment or Juntos message (counters, feed and notifications too). */
export const removeContent = internalMutation({
  args: { target: reportTarget, targetId: v.string() },
  handler: async (ctx, { target, targetId }) => {
    await removeReported(ctx, target, targetId);
    return null;
  },
});

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long a moderator may suspend for; `"permanent"` is for admins. */
const suspensionDuration = v.union(
  v.literal(1),
  v.literal(7),
  v.literal(30),
  v.literal("permanent"),
);

/** Suspends a reader for `days` (or for good) and says why; they see it when they sign in. */
async function suspendUser(
  ctx: MutationCtx,
  user: Doc<"users">,
  duration: 1 | 7 | 30 | "permanent",
  reason: string | undefined,
) {
  const now = Date.now();
  await ctx.db.patch(user._id, {
    suspendedAt: now,
    suspendedUntil: duration === "permanent" ? undefined : now + duration * DAY_MS,
    suspendReason: reason || undefined,
  });
}

/**
 * Suspends (or, with `suspend: false`, restores) a reader: hidden and unable to use the app.
 * `days` omitted means permanent.
 */
export const suspend = internalMutation({
  args: {
    username: v.string(),
    suspend: v.boolean(),
    days: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { username, suspend, days, reason }) => {
    const user = await userByUsername(ctx, username.toLowerCase());
    if (!user) throw notFound("Leitor");
    if (suspend) {
      const now = Date.now();
      await ctx.db.patch(user._id, {
        suspendedAt: now,
        suspendedUntil: days ? now + days * DAY_MS : undefined,
        suspendReason: reason || undefined,
      });
    } else {
      await ctx.db.patch(user._id, {
        suspendedAt: undefined,
        suspendedUntil: undefined,
        suspendReason: undefined,
      });
    }
    await logAction(ctx, null, suspend ? "suspend" : "unsuspend", { targetUserId: user._id });
    return null;
  },
});

/**
 * Approves (public: in everyone's search) or rejects (stays only on the shelf of whoever added
 * it) a hand-added book. The panel uses `decideBook`; this is for the dashboard and the CLI.
 */
export const reviewBook = internalMutation({
  args: { openLibraryId: v.string(), approve: v.boolean() },
  handler: async (ctx, { openLibraryId, approve }) => {
    await decide(ctx, openLibraryId, approve);
    return null;
  },
});

/** Gives (or takes back) the admin role: `npx convex run moderation:setAdmin`. */
export const setAdmin = internalMutation({
  args: { username: v.string(), admin: v.boolean() },
  handler: async (ctx, { username, admin }) => {
    const user = await userByUsername(ctx, username.toLowerCase());
    if (!user) throw notFound("Leitor");
    await ctx.db.patch(user._id, { role: admin ? "admin" : undefined });
    await logAction(ctx, null, admin ? "role_grant" : "role_revoke", {
      targetUserId: user._id,
      details: "admin",
    });
    return null;
  },
});

/** Gives (or takes back) the moderator role without an invite: `moderation:setModerator`. */
export const setModerator = internalMutation({
  args: { username: v.string(), moderator: v.boolean() },
  handler: async (ctx, { username, moderator }) => {
    const user = await userByUsername(ctx, username.toLowerCase());
    if (!user) throw notFound("Leitor");
    if (user.role === "admin") throw appError("INVALID", "Essa conta é admin.");
    await ctx.db.patch(user._id, { role: moderator ? "moderator" : undefined });
    await logAction(ctx, null, moderator ? "role_grant" : "role_revoke", {
      targetUserId: user._id,
      details: "moderator",
    });
    return null;
  },
});

async function decide(ctx: MutationCtx, openLibraryId: string, approve: boolean) {
  const book = await ctx.db
    .query("books")
    .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
    .unique();
  if (!book?.reviewStatus) throw notFound("Livro cadastrado");
  await reviewBookIn(ctx, book, approve);
}

/** Deletes what a report points at (a reader can't be deleted: they get suspended instead). */
async function removeReported(ctx: MutationCtx, target: ReportTarget, targetId: string) {
  if (target === "post") {
    const id = ctx.db.normalizeId("posts", targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (post) await deletePost(ctx, post);
  } else if (target === "comment") {
    const id = ctx.db.normalizeId("postComments", targetId);
    const comment = id ? await ctx.db.get(id) : null;
    if (comment) await deleteComment(ctx, comment);
  } else if (target === "message") {
    const id = ctx.db.normalizeId("groupMessages", targetId);
    if (id && (await ctx.db.get(id))) await ctx.db.delete(id);
  }
}

// The moderation panel (`/admin` on the web): open reports and hand-added books to review.
// Lists are paged by number (`page`, `pageSize`) over at most `LIST_CAP` rows, filtered and
// sorted on the server, so the panel can show "Página 2 de 7".

/** Rows each panel list reads to count and page; past it totals read "500+". */
const LIST_CAP = 500;
const MAX_PAGE_SIZE = 50;
/** Most reporters listed on one card (the card says how many more there are). */
const MAX_REPORTERS_SHOWN = 5;

const pageArgs = { page: v.number(), pageSize: v.number() };

/** One page of `rows`; the page is clamped, so asking past the end returns the last one. */
function pageOf<T>(rows: T[], page: number, pageSize: number) {
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize) || 10));
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  return {
    items: rows.slice((current - 1) * size, current * size),
    total: rows.length,
    capped: rows.length >= LIST_CAP,
    page: current,
    pageSize: size,
    pages,
  };
}

/** Lowercase, no accents, no leading @: what search compares. */
const normalize = (text: string) =>
  text.trim().replace(/^@/, "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type ReportGroup = { primary: Doc<"reports">; reports: Doc<"reports">[] };

/**
 * Open reports grouped by what they point at (one card per post, comment, message or reader),
 * oldest first. Reports about the team are for admins only.
 */
async function openReportGroups(ctx: QueryCtx, staff: Doc<"users">): Promise<ReportGroup[]> {
  const rows = await ctx.db
    .query("reports")
    .withIndex("by_status_created", (q) => q.eq("status", "open"))
    .take(LIST_CAP);
  let visible = rows;
  if (staff.role !== "admin") {
    const team = await Promise.all(
      (["admin", "moderator"] as const).map((role) =>
        ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", role))
          .take(200),
      ),
    );
    const hidden = new Set(team.flat().map((user) => user._id));
    visible = rows.filter((row) => !row.targetUserId || !hidden.has(row.targetUserId));
  }
  const groups = new Map<string, ReportGroup>();
  for (const report of visible) {
    const key = `${report.target}:${report.targetId}`;
    const group = groups.get(key);
    if (group) group.reports.push(report);
    else groups.set(key, { primary: report, reports: [report] });
  }
  return [...groups.values()];
}

async function pendingBooks(ctx: QueryCtx) {
  return ctx.db
    .query("books")
    .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "pending"))
    .take(LIST_CAP);
}

/** Tab badges: how many reports and books wait (unfiltered). */
export const counts = query({
  args: {},
  handler: async (ctx) => {
    const staff = await requireStaff(ctx);
    const [groups, books] = await Promise.all([openReportGroups(ctx, staff), pendingBooks(ctx)]);
    return { reports: groups.length, books: books.length, cap: LIST_CAP };
  },
});

/**
 * Open reports for the panel, one entry per reported thing, with what a moderator needs to
 * investigate it. Filters: `reason` (any of its reports), `target` (post, comment, reader…),
 * `search` (the reported reader's name or @, or words in the reported text). `sort`: oldest
 * first (default), newest first, or most reported.
 */
export const reports = query({
  args: {
    ...pageArgs,
    reason: v.optional(reportReason),
    target: v.optional(reportTarget),
    sort: v.optional(v.union(v.literal("oldest"), v.literal("newest"), v.literal("most"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    let groups = await openReportGroups(ctx, staff);
    const { reason, target } = args;
    if (reason) groups = groups.filter((g) => g.reports.some((r) => r.reason === reason));
    if (target) groups = groups.filter((g) => g.primary.target === target);
    const needle = args.search ? normalize(args.search) : "";
    if (needle) {
      const ids = new Set<Doc<"users">["_id"]>();
      for (const g of groups) if (g.primary.targetUserId) ids.add(g.primary.targetUserId);
      const users = new Map<string, Doc<"users">>();
      for (const user of await Promise.all([...ids].map((id) => ctx.db.get(id)))) {
        if (user) users.set(user._id, user);
      }
      groups = groups.filter((g) => {
        const user = g.primary.targetUserId ? users.get(g.primary.targetUserId) : undefined;
        const byUser =
          user &&
          (normalize(user.username).includes(needle) || normalize(user.name).includes(needle));
        return byUser || normalize(g.primary.snapshot ?? "").includes(needle);
      });
    }
    const latest = (g: ReportGroup) => g.reports[g.reports.length - 1]?.createdAt ?? 0;
    if (args.sort === "newest") groups.sort((x, y) => latest(y) - latest(x));
    else if (args.sort === "most") {
      groups.sort(
        (x, y) => y.reports.length - x.reports.length || x.primary.createdAt - y.primary.createdAt,
      );
    }
    const paged = pageOf(groups, args.page, args.pageSize);
    return {
      ...paged,
      items: await Promise.all(paged.items.map((group) => reportSummary(ctx, staff, group))),
    };
  },
});

/** Hand-added books waiting for review, oldest first; `search` matches title, author or adder. */
export const books = query({
  args: { ...pageArgs, search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const rows = await pendingBooks(ctx);
    const needle = args.search ? normalize(args.search) : "";
    const creators = new Map<string, Doc<"users"> | null>();
    for (const id of new Set(rows.flatMap((book) => (book.createdBy ? [book.createdBy] : [])))) {
      creators.set(id, await ctx.db.get(id));
    }
    const matches = needle
      ? rows.filter((book) => {
          const creator = book.createdBy ? creators.get(book.createdBy) : null;
          return [book.title, ...book.authors, creator?.username ?? "", creator?.name ?? ""].some(
            (text) => normalize(text).includes(needle),
          );
        })
      : rows;
    const paged = pageOf(matches, args.page, args.pageSize);
    return {
      ...paged,
      items: paged.items.map((book) => {
        const author = book.createdBy ? creators.get(book.createdBy) : null;
        return {
          openLibraryId: book.openLibraryId,
          title: book.title,
          authors: book.authors,
          pageCount: book.pageCount,
          publishedYear: book.publishedYear,
          addedAt: book._creationTime,
          addedBy: author ? authorOf(author) : null,
        };
      }),
    };
  },
});

const countBy = <T>(rows: T[], match: (row: T) => boolean) => rows.filter(match).length;

/** Light version of a report for the list: enough to recognise it, nothing that costs reads. */
async function reportSummary(ctx: QueryCtx, staff: Doc<"users">, group: ReportGroup) {
  const { primary, reports } = group;
  const targetUser = primary.targetUserId ? await ctx.db.get(primary.targetUserId) : null;
  return {
    /** The oldest report of the group; the peek opens the whole group from it. */
    id: primary._id,
    target: primary.target,
    createdAt: reports[reports.length - 1]?.createdAt ?? primary.createdAt,
    reportCount: reports.length,
    reasons: [...new Set(reports.map((report) => report.reason))],
    /** The start of the reported text, as copied when it was first reported. */
    snippet: primary.snapshot?.slice(0, 200) ?? null,
    targetUser: targetUser
      ? {
          ...authorOf(targetUser),
          suspended: isSuspended(targetUser),
          canAct: canModerate(staff, targetUser),
        }
      : null,
  };
}

/**
 * Everything a moderator needs to investigate one report (the peek): the reported thing as it is
 * now, the account and its record, every reporter. Null once it was dealt with (or when it is
 * about the team and the viewer is a moderator).
 */
export const reportDetail = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    const staff = await requireStaff(ctx);
    const first = await ctx.db.get(reportId);
    if (first?.status !== "open") return null;
    const same = await ctx.db
      .query("reports")
      .withIndex("by_target", (q) => q.eq("target", first.target).eq("targetId", first.targetId))
      .take(100);
    const reports = same.filter((row) => row.status === "open");
    const primary = reports[0];
    if (!primary) return null;
    if (staff.role !== "admin" && primary.targetUserId) {
      const target = await ctx.db.get(primary.targetUserId);
      if (target?.role) return null;
    }
    return reportView(ctx, staff, { primary, reports });
  },
});

/** A hand-added book under review, with who added it and their record (the peek). */
export const bookReview = query({
  args: { openLibraryId: v.string() },
  handler: async (ctx, { openLibraryId }) => {
    const staff = await requireStaff(ctx);
    const book = await ctx.db
      .query("books")
      .withIndex("by_openLibraryId", (q) => q.eq("openLibraryId", openLibraryId))
      .unique();
    if (book?.reviewStatus !== "pending") return null;
    const adder = book.createdBy ? await ctx.db.get(book.createdBy) : null;
    const [theirBooks, record] = await Promise.all([
      book.createdBy
        ? ctx.db
            .query("books")
            .withIndex("by_createdBy", (q) => q.eq("createdBy", book.createdBy))
            .take(100)
        : [],
      adder ? accountRecord(ctx, adder) : null,
    ]);
    return {
      openLibraryId: book.openLibraryId,
      title: book.title,
      authors: book.authors,
      genres: book.genres,
      pageCount: book.pageCount,
      publishedYear: book.publishedYear,
      coverUrl: book.coverUrl,
      addedAt: book._creationTime,
      readers: book.readerCount ?? 0,
      addedBy: adder
        ? {
            ...authorOf(adder),
            joinedAt: adder._creationTime,
            followers: adder.followers,
            bookCount: adder.bookCount,
            suspended: isSuspended(adder),
            canAct: canModerate(staff, adder),
            history: record,
          }
        : null,
      /** What happened to the other books this reader added by hand. */
      theirBooks: {
        total: theirBooks.length,
        approved: countBy(theirBooks, (b) => b.reviewStatus === "approved"),
        rejected: countBy(theirBooks, (b) => b.reviewStatus === "rejected"),
        pending: countBy(theirBooks, (b) => b.reviewStatus === "pending"),
      },
    };
  },
});

/** One card of the panel: the reported thing, who wrote it, their record, and who reported. */
async function reportView(ctx: QueryCtx, staff: Doc<"users">, group: ReportGroup) {
  const { primary, reports } = group;
  const targetUser = primary.targetUserId ? await ctx.db.get(primary.targetUserId) : null;
  const [content, history, reporters] = await Promise.all([
    reportContent(ctx, primary),
    targetUser ? accountRecord(ctx, targetUser) : null,
    Promise.all(
      reports.slice(0, MAX_REPORTERS_SHOWN).map(async (report) => {
        const reporter = report.reporterId ? await ctx.db.get(report.reporterId) : null;
        const filed = reporter
          ? await ctx.db
              .query("reports")
              .withIndex("by_reporter_target", (q) => q.eq("reporterId", reporter._id))
              .take(100)
          : [];
        return {
          id: report._id,
          reason: report.reason,
          details: report.details,
          createdAt: report.createdAt,
          reporter: reporter ? { ...authorOf(reporter), joinedAt: reporter._creationTime } : null,
          /** How this reader's earlier reports turned out (a signal of how far to trust it). */
          track: {
            filed: filed.length,
            actioned: countBy(filed, (r) => r.status === "actioned"),
            dismissed: countBy(filed, (r) => r.status === "dismissed"),
          },
        };
      }),
    ),
  ]);
  return {
    /** The oldest report of the group: acting on it closes the others too. */
    id: primary._id,
    target: primary.target,
    targetId: primary.targetId,
    /** Copy of the text when it was first reported (the content may have changed or gone). */
    snapshot: primary.snapshot,
    createdAt: primary.createdAt,
    reportCount: reports.length,
    reasons: [...new Set(reports.map((report) => report.reason))],
    reporters,
    moreReporters: Math.max(0, reports.length - reporters.length),
    targetUser: targetUser
      ? {
          ...authorOf(targetUser),
          suspended: isSuspended(targetUser),
          suspendedUntil: targetUser.suspendedUntil ?? null,
          suspendReason: targetUser.suspendReason ?? null,
          /** False for the team and yourself: no removing or suspending them from here. */
          canAct: canModerate(staff, targetUser),
          joinedAt: targetUser._creationTime,
          followers: targetUser.followers,
          bookCount: targetUser.bookCount,
          history,
        }
      : null,
    /** What the reports point at, as it is now; null when it is already gone. */
    content,
  };
}

/** A reader's moderation record: reports about them and what was done before. */
async function accountRecord(ctx: QueryCtx, user: Doc<"users">) {
  const [reports, actions] = await Promise.all([
    ctx.db
      .query("reports")
      .withIndex("by_target_user", (q) => q.eq("targetUserId", user._id))
      .take(100),
    ctx.db
      .query("moderationLog")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", user._id))
      .take(100),
  ]);
  return {
    reports: reports.length,
    open: countBy(reports, (r) => r.status === "open"),
    actioned: countBy(reports, (r) => r.status === "actioned"),
    dismissed: countBy(reports, (r) => r.status === "dismissed"),
    suspensions: countBy(actions, (a) => a.action === "suspend"),
    removals: countBy(actions, (a) => a.action === "remove"),
  };
}

/** The reported thing as it is now, with its context; null when it's gone. */
async function reportContent(ctx: QueryCtx, report: Doc<"reports">) {
  if (report.target === "post") {
    const id = ctx.db.normalizeId("posts", report.targetId);
    const post = id ? await ctx.db.get(id) : null;
    if (!post) return null;
    const book = post.bookId ? await ctx.db.get(post.bookId) : null;
    return {
      kind: "post" as const,
      postId: post._id,
      groupId: null,
      postKind: post.kind,
      body: post.body,
      rating: post.rating,
      hasSpoilers: post.hasSpoilers,
      createdAt: post._creationTime,
      likes: post.likeCount,
      comments: post.commentCount,
      book: book ? { title: book.title, openLibraryId: book.openLibraryId } : null,
    };
  }
  if (report.target === "comment") {
    const id = ctx.db.normalizeId("postComments", report.targetId);
    const comment = id ? await ctx.db.get(id) : null;
    if (!comment) return null;
    const post = await ctx.db.get(comment.postId);
    const postAuthor = post ? await ctx.db.get(post.authorId) : null;
    return {
      kind: "comment" as const,
      postId: comment.postId,
      groupId: null,
      body: comment.body,
      createdAt: comment._creationTime,
      post: post
        ? { author: postAuthor ? authorOf(postAuthor) : null, snippet: post.body.slice(0, 200) }
        : null,
    };
  }
  if (report.target === "message") {
    const id = ctx.db.normalizeId("groupMessages", report.targetId);
    const message = id ? await ctx.db.get(id) : null;
    if (!message) return null;
    const group = await ctx.db.get(message.groupId);
    const book = group ? await ctx.db.get(group.bookId) : null;
    return {
      kind: "message" as const,
      postId: null,
      groupId: message.groupId,
      body: message.body,
      percent: message.percent,
      createdAt: message.createdAt,
      bookTitle: book?.title ?? null,
      members: group?.memberCount ?? null,
    };
  }
  const id = ctx.db.normalizeId("users", report.targetId);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) return null;
  return {
    kind: "user" as const,
    postId: null,
    groupId: null,
    body: user.bio,
    createdAt: user._creationTime,
  };
}

/**
 * Decides a report: dismiss it, remove the content, or suspend its author (who disappears from
 * the app for `duration`, with a `reason` they can read). Other open reports about the same thing
 * are closed with it. Nobody acts on themselves, moderators never on the team (`canModerate`),
 * and only admins suspend for good. Every action goes to `moderationLog`.
 */
export const act = mutation({
  args: {
    reportId: v.id("reports"),
    action: v.union(v.literal("dismiss"), v.literal("remove"), v.literal("suspend")),
    duration: v.optional(suspensionDuration),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, action, duration, reason }) => {
    const staff = await requireStaff(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw notFound("Denúncia");
    const target = report.targetUserId ? await ctx.db.get(report.targetUserId) : null;
    // Admins may always close a report about the team; everything else needs `canModerate`.
    const allowed =
      action === "dismiss" && staff.role === "admin" ? true : canModerate(staff, target);
    if (!allowed) throw appError("FORBIDDEN", "Você não pode agir sobre essa conta.");
    let details: string | undefined;
    if (action === "remove") await removeReported(ctx, report.target, report.targetId);
    if (action === "suspend") {
      if (!target) throw appError("INVALID", "Essa conta não existe mais.");
      if (!duration) throw appError("INVALID", "Escolha por quanto tempo.");
      if (duration === "permanent" && staff.role !== "admin") {
        throw appError("FORBIDDEN", "Só admins suspendem para sempre.");
      }
      const text = reason?.trim().slice(0, MAX_SUSPENSION_REASON);
      if (!text) throw appError("INVALID", "Diga o motivo da suspensão.");
      await suspendUser(ctx, target, duration, text);
      details = `${duration === "permanent" ? "permanente" : `${duration} d`}: ${text}`;
    }
    await logAction(ctx, staff, action, {
      targetUserId: report.targetUserId,
      targetId: report.targetId,
      details: details ?? report.target,
    });
    const status = action === "dismiss" ? "dismissed" : "actioned";
    const now = Date.now();
    const open = await ctx.db
      .query("reports")
      .withIndex("by_status_created", (q) => q.eq("status", "open"))
      .take(500);
    for (const other of open) {
      if (other.target === report.target && other.targetId === report.targetId) {
        await ctx.db.patch(other._id, { status, resolvedAt: now });
      }
    }
    return null;
  },
});

/** Approve or reject a hand-added book from the panel. */
export const decideBook = mutation({
  args: { openLibraryId: v.string(), approve: v.boolean() },
  handler: async (ctx, { openLibraryId, approve }) => {
    const staff = await requireStaff(ctx);
    await decide(ctx, openLibraryId, approve);
    await logAction(ctx, staff, approve ? "book_approve" : "book_reject", {
      targetId: openLibraryId,
    });
    return null;
  },
});

/** Moderation history, newest first (admins only). `action` filters by kind of action. */
export const log = query({
  args: { ...pageArgs, action: v.optional(logActionKind) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const fetched = await ctx.db
      .query("moderationLog")
      .withIndex("by_createdAt")
      .order("desc")
      .take(LIST_CAP);
    const rows = args.action ? fetched.filter((row) => row.action === args.action) : fetched;
    const paged = pageOf(rows, args.page, args.pageSize);
    const people = new Map<string, Promise<Doc<"users"> | null>>();
    const person = (id: Doc<"users">["_id"] | null) => {
      if (!id) return Promise.resolve(null);
      if (!people.has(id)) people.set(id, ctx.db.get(id));
      return people.get(id) ?? Promise.resolve(null);
    };
    return {
      ...paged,
      items: await Promise.all(
        paged.items.map(async (row) => {
          const [actor, targetUser] = await Promise.all([
            person(row.actorId),
            person(row.targetUserId),
          ]);
          return {
            id: row._id,
            action: row.action,
            targetId: row.targetId,
            details: row.details,
            createdAt: row.createdAt,
            actor: actor ? authorOf(actor) : null,
            targetUser: targetUser ? authorOf(targetUser) : null,
          };
        }),
      ),
    };
  },
});
