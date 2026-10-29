import { api, type Id } from "@grimo/backend";
import type { ReportReason, ReportTarget } from "@grimo/core";
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

/** Dismiss, remove the content, or suspend its author; the report (and its twins) leave at once. */
export function useActOnReport() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({
      report,
      action,
    }: {
      report: QueuedReport;
      action: "dismiss" | "remove" | "suspend";
    }) => convex.mutation(api.moderation.act, { reportId: report.id, action }),
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
