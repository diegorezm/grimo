import { api, type Id } from "@grimo/backend";
import type { ReportReason, ReportTarget, SuspensionDuration } from "@grimo/core";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import type { ReaderPage } from "../profiles/hooks";

export type BlockedReader = FunctionReturnType<typeof api.moderation.blocked>["items"][number];

export function blockedReadersQuery() {
  return convexQuery(api.moderation.blocked, {}, "required");
}

/** Readers I blocked (settings, to unblock). */
export function useBlockedReaders() {
  return useQuery(blockedReadersQuery());
}

export interface ReportInput {
  target: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/** Reports a post, comment or reader to moderation. */
export function useReport() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (input: ReportInput) =>
      convex.mutation(api.moderation.report, {
        ...input,
        details: input.details?.trim() || undefined,
      }),
  });
}

/**
 * Block/unblock a reader. Their page flips to "Desbloquear" and the blocked list updates at
 * once (rolled back on error); the server also undoes the follows both ways, and the feed and
 * lists drop their content through the subscriptions.
 */
export function useSetBlocked() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ userId, block }: { userId: string; block: boolean }) =>
      convex.mutation(api.moderation.setBlocked, { userId: userId as Id<"users">, block }),
    onMutate: async ({ userId, block }) => {
      const rollbackPage = await patchQueries<ReaderPage>(
        [convexQueryPrefix(api.users.byUsername)],
        (page) =>
          page.profile.id === userId
            ? { ...page, blockedByMe: block, isFollowing: block ? false : page.isFollowing }
            : page,
      );
      const rollbackList = block
        ? null
        : await patchQueries<{ items: BlockedReader[] }>(
            [convexQueryPrefix(api.moderation.blocked)],
            (list) => ({ items: list.items.filter((reader) => reader.id !== userId) }),
          );
      return () => {
        rollbackPage();
        rollbackList?.();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export type ModerationReports = FunctionReturnType<typeof api.moderation.reports>;
export type QueuedReport = ModerationReports["items"][number];
export type ReportDetail = NonNullable<FunctionReturnType<typeof api.moderation.reportDetail>>;
export type BookReviewDetail = NonNullable<FunctionReturnType<typeof api.moderation.bookReview>>;
export type ModerationBooks = FunctionReturnType<typeof api.moderation.books>;
export type QueuedBook = ModerationBooks["items"][number];
export type ModerationCounts = FunctionReturnType<typeof api.moderation.counts>;
export type ModerationLog = FunctionReturnType<typeof api.moderation.log>;
export type ModerationLogItem = ModerationLog["items"][number];

/** Items per page in the panel: its cards are tall, so pages are shorter than the app's 20. */
export const PANEL_PAGE_SIZE = 10;

/** What the report list can be narrowed and ordered by (all optional). */
export interface ReportFilters {
  reason?: ReportReason;
  target?: ReportTarget;
  sort?: "oldest" | "newest" | "most";
  search?: string;
}

/** Drops empty filters so they don't change the query. */
const compact = <T extends object>(filters: T) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  ) as T;

/** How many reports and books wait, for the panel's tabs (capped at `cap`). */
export function moderationCountsQuery() {
  return convexQuery(api.moderation.counts, {}, "required");
}

export function useModerationCounts() {
  return useQuery(moderationCountsQuery());
}

/**
 * One page of open reports (one entry per reported thing). Live. The previous page stays on
 * screen while the next one loads.
 */
export function useModerationReports(page: number, filters: ReportFilters = {}) {
  return useQuery({
    ...convexQuery(
      api.moderation.reports,
      { page, pageSize: PANEL_PAGE_SIZE, ...compact(filters) },
      "required",
    ),
    placeholderData: keepPreviousData,
  });
}

/** One page of hand-added books waiting for review; `search` matches title, author or adder. */
export function useModerationBooks(page: number, search = "") {
  return useQuery({
    ...convexQuery(
      api.moderation.books,
      { page, pageSize: PANEL_PAGE_SIZE, ...compact({ search }) },
      "required",
    ),
    placeholderData: keepPreviousData,
  });
}

export type LogAction = ModerationLogItem["action"];

/** One page of the moderation history, newest first (admins only); `action` filters it. */
export function useModerationLog(page: number, action?: LogAction) {
  return useQuery({
    ...convexQuery(
      api.moderation.log,
      { page, pageSize: PANEL_PAGE_SIZE, ...compact({ action }) },
      "required",
    ),
    placeholderData: keepPreviousData,
  });
}

/** The full view of one report (the side peek); null once it was dealt with. */
export function useModerationReport(reportId: string) {
  return useQuery(
    convexQuery(api.moderation.reportDetail, { reportId: reportId as Id<"reports"> }, "required"),
  );
}

/** A hand-added book under review with its adder's record (the side peek). */
export function useBookReview(openLibraryId: string) {
  return useQuery(convexQuery(api.moderation.bookReview, { openLibraryId }, "required"));
}

const reportsLists = [convexQueryPrefix(api.moderation.reports)];
const booksLists = [convexQueryPrefix(api.moderation.books)];
const counts = [convexQueryPrefix(api.moderation.counts)];

/**
 * Dismiss, remove the content, or suspend its author (with `duration` and `reason`); the report
 * (and its twins) leave every cached page at once.
 */
export function useActOnReport() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({
      reportId,
      action,
      duration,
      reason,
    }: {
      reportId: Id<"reports">;
      action: "dismiss" | "remove" | "suspend";
      duration?: SuspensionDuration;
      reason?: string;
    }) => convex.mutation(api.moderation.act, { reportId, action, duration, reason }),
    onMutate: async ({ reportId }) => {
      const rollbackList = await patchQueries<ModerationReports>(reportsLists, (data) => {
        const items = data.items.filter((item) => item.id !== reportId);
        return items.length === data.items.length
          ? data
          : { ...data, items, total: Math.max(0, data.total - 1) };
      });
      const rollbackCounts = await patchQueries<ModerationCounts>(counts, (data) => ({
        ...data,
        reports: Math.max(0, data.reports - 1),
      }));
      return () => {
        rollbackList();
        rollbackCounts();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Approve or reject a hand-added book. */
export function useDecideBook() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { openLibraryId: string; approve: boolean }) =>
      convex.mutation(api.moderation.decideBook, input),
    onMutate: async ({ openLibraryId }) => {
      const rollbackList = await patchQueries<ModerationBooks>(booksLists, (data) => {
        const items = data.items.filter((book) => book.openLibraryId !== openLibraryId);
        return items.length === data.items.length
          ? data
          : { ...data, items, total: Math.max(0, data.total - 1) };
      });
      const rollbackCounts = await patchQueries<ModerationCounts>(counts, (data) => ({
        ...data,
        books: Math.max(0, data.books - 1),
      }));
      return () => {
        rollbackList();
        rollbackCounts();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

export type ModerationTeam = FunctionReturnType<typeof api.moderators.team>;
export type ModeratorInvite = ModerationTeam["invites"][number];
export type MyModeratorInvite = NonNullable<FunctionReturnType<typeof api.moderators.myInvite>>;

export function myModeratorInviteQuery() {
  return convexQuery(api.moderators.myInvite, {}, "required");
}

/** The viewer's open invite to become a moderator (null when there is none). */
export function useMyModeratorInvite() {
  return useQuery(myModeratorInviteQuery());
}

const myInvite = [convexQueryPrefix(api.moderators.myInvite)];

/** Accept or decline the invite; the banner goes away at once. */
export function useRespondToModeratorInvite() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { inviteId: Id<"moderatorInvites">; accept: boolean }) =>
      convex.mutation(api.moderators.respond, input),
    onMutate: () => patchQueries<MyModeratorInvite | null>(myInvite, () => null),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Moderators and open invites (admins only). */
export function moderationTeamQuery() {
  return convexQuery(api.moderators.team, {}, "required");
}

export function useModerationTeam(options: { enabled?: boolean } = {}) {
  return useQuery({ ...moderationTeamQuery(), ...options });
}

const team = [convexQueryPrefix(api.moderators.team)];

/** Invite a reader (by @) to moderate. The new invite arrives through the team subscription. */
export function useInviteModerator() {
  const { convex } = useConvexCache();
  return useMutation({
    mutationFn: (username: string) => convex.mutation(api.moderators.invite, { username }),
  });
}

/** Withdraw an open invite. */
export function useRevokeModeratorInvite() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (inviteId: Id<"moderatorInvites">) =>
      convex.mutation(api.moderators.revoke, { inviteId }),
    onMutate: (inviteId) =>
      patchQueries<ModerationTeam>(team, (data) => ({
        ...data,
        invites: data.invites.filter((invite) => invite.id !== inviteId),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Take the moderator role from someone. */
export function useRemoveModerator() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (userId: Id<"users">) =>
      convex.mutation(api.moderators.removeModerator, { userId }),
    onMutate: (userId) =>
      patchQueries<ModerationTeam>(team, (data) => ({
        ...data,
        moderators: data.moderators.filter((reader) => reader.id !== userId),
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}
