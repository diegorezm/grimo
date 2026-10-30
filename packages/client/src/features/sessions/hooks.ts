import { api, type Id } from "@grimo/backend";
import type { UpdateNoteInput } from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";

export type ActiveSession = NonNullable<FunctionReturnType<typeof api.sessions.active>>;

/** The reading session running now, or null (route loaders prefetch it). */
export function activeSessionQuery() {
  return convexQuery(api.sessions.active, {}, "required");
}

export function useActiveSession() {
  return useQuery(activeSessionQuery());
}

/** "Ofensiva": days in a row with reading. */
export function streakQuery() {
  return convexQuery(api.sessions.streak, {}, "required");
}

export function useStreak() {
  return useQuery(streakQuery());
}

/** Milliseconds since `startedAt`, ticking every second while there is one. */
export function useElapsed(startedAt: number | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt ? Math.max(0, now - startedAt) : 0;
}

const active = () => [convexQueryPrefix(api.sessions.active)];

/** Starts the timer on a book you are reading; it shows at once (rolled back on error). */
export function useStartSession() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({ entryId }: { entryId: string; book: ActiveSession["book"]; page: number }) =>
      convex.mutation(api.sessions.start, { entryId: entryId as Id<"shelfEntries"> }),
    onMutate: ({ entryId, book, page }) =>
      patchQueries<ActiveSession | null>(active(), () => ({
        id: "" as Id<"readingSessions">,
        entryId: entryId as Id<"shelfEntries">,
        startedAt: Date.now(),
        startPage: page,
        book,
      })),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Stops the timer at `page` (with an optional note for the feed). */
export function useFinishSession() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: (input: { page: number; note?: UpdateNoteInput }) =>
      convex.mutation(api.sessions.finish, input),
    onMutate: () => patchQueries<ActiveSession | null>(active(), () => null),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** Throws the running timer away. */
export function useDiscardSession() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: () => convex.mutation(api.sessions.discard, {}),
    onMutate: () => patchQueries<ActiveSession | null>(active(), () => null),
    onError: (_error, _input, rollback) => rollback?.(),
  });
}
