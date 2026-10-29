import { api, type Id } from "@grimo/backend";
import type { ReportReason, ReportTarget, SuspensionDuration } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export type ModerationQueue = FunctionReturnType<typeof api.moderation.queue>;
export type QueuedReport = ModerationQueue["reports"][number];
export type QueuedBook = ModerationQueue["books"][number];

/** The moderation panel: open reports and hand-added books to review (admins only). */
export function moderationQueueQuery() {
  return convexQuery(api.moderation.queue, {}, "required");
}

export function useModerationQueue(options: { enabled?: boolean } = {}) {
  return useQuery({ ...moderationQueueQuery(), ...options });
}

const queue = [convexQueryPrefix(api.moderation.queue)];

export type ModerationLog = FunctionReturnType<typeof api.moderation.log>;
export type ModerationLogItem = ModerationLog["items"][number];

/** The moderation history (admins only). */
export function moderationLogQuery() {
  return convexQuery(api.moderation.log, {}, "required");
}

export function useModerationLog(options: { enabled?: boolean } = {}) {
  return useQuery({ ...moderationLogQuery(), ...options });
}

/**
 * Dismiss, remove the content, or suspend its author (with `duration` and `reason`); the report
 * (and its twins) leave at once.
 */
export function useActOnReport() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({
      report,
      action,
      duration,
      reason,
    }: {
      report: QueuedReport;
      action: "dismiss" | "remove" | "suspend";
      duration?: SuspensionDuration;
      reason?: string;
    }) => convex.mutation(api.moderation.act, { reportId: report.id, action, duration, reason }),
    onMutate: ({ report }) =>
      patchQueries<ModerationQueue>(queue, (data) => ({
        ...data,
        reports: data.reports.filter(
          (item) => !(item.target === report.target && item.targetId === report.targetId),
        ),
      })),
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
    onMutate: ({ openLibraryId }) =>
      patchQueries<ModerationQueue>(queue, (data) => ({
        ...data,
        books: data.books.filter((book) => book.openLibraryId !== openLibraryId),
      })),
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
