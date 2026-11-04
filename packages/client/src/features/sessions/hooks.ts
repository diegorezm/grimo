import { api, type Id } from "@grimo/backend";
import {
  buildSessionRecap,
  type Feeling,
  type FocusState,
  focusClock,
  focusPhaseKey,
  focusRestMs,
  isFocusOfSession,
  restoreFocus,
  type SessionRecap,
  serializeFocus,
  settleFocus,
  type UpdateNoteInput,
} from "@grimo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
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

/**
 * The reading timer on the client: what the clock is doing (shared by the full screen and the
 * corner clock) and whether it is minimized so you can keep using the app.
 */
export const useFocusStore = create<{
  minimized: boolean;
  timer: { entryId: string; state: FocusState } | null;
  setMinimized: (minimized: boolean) => void;
  setTimer: (timer: { entryId: string; state: FocusState }) => void;
  /** The session just saved, while its share card is open. */
  recap: SessionRecap | null;
  setRecap: (recap: SessionRecap | null) => void;
}>((set) => ({
  minimized: false,
  timer: null,
  setMinimized: (minimized) => set({ minimized }),
  setTimer: (timer) => set({ timer }),
  recap: null,
  setRecap: (recap) => set({ recap }),
}));

const active = () => [convexQueryPrefix(api.sessions.active)];

/** Starts the timer on a book you are reading; it shows at once (rolled back on error). */
export function useStartSession() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: ({
      entryId,
    }: {
      entryId: string;
      book: ActiveSession["book"];
      page: number;
      pageCount: number | null;
    }) => convex.mutation(api.sessions.start, { entryId: entryId as Id<"shelfEntries"> }),
    onMutate: ({ entryId, book, page, pageCount }) =>
      patchQueries<ActiveSession | null>(active(), () => ({
        id: "" as Id<"readingSessions">,
        entryId: entryId as Id<"shelfEntries">,
        startedAt: Date.now(),
        startPage: page,
        pageCount,
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
    mutationFn: (input: {
      page: number;
      note?: UpdateNoteInput;
      pageFeelings?: Feeling[];
      restMs?: number;
    }) => convex.mutation(api.sessions.finish, input),
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

/** Where this device keeps the timer. Synchronous; may lose data (the timer then starts over). */
export interface FocusStorage {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
}

const FOCUS_STATE_KEY = "grimo:reading-focus";
const FOCUS_MODE_KEY = "grimo:reading-focus-mode";

/** Remembers the mode the next session starts in. */
export const saveFocusMode = (storage: FocusStorage, mode: string) =>
  storage.set(FOCUS_MODE_KEY, mode);

/**
 * The running session's timer, ticking every second: what the clock shows, and `update` for the
 * controls (pass it `pauseFocus(...)`, `skipFocusPhase(...)`...). `onPhaseEnd` rings when a phase
 * ends by itself. Keep it mounted while there is a session, so it also rings when minimized.
 */
export function useFocusTimer(
  session: ActiveSession,
  { storage, onPhaseEnd }: { storage: FocusStorage; onPhaseEnd?: () => void },
) {
  const timer = useFocusStore((store) => store.timer);
  const setTimer = useFocusStore((store) => store.setTimer);
  useElapsed(session.startedAt);
  const now = Date.now();
  const stored =
    timer?.entryId === session.entryId && isFocusOfSession(timer.state, session)
      ? timer.state
      : restoreFocus(storage.get(FOCUS_STATE_KEY), storage.get(FOCUS_MODE_KEY), session);
  const state = settleFocus(stored, now);
  const lastPhase = useRef(focusPhaseKey(state));

  const update = (next: FocusState) => {
    lastPhase.current = focusPhaseKey(next);
    setTimer({ entryId: session.entryId, state: next });
    storage.set(FOCUS_STATE_KEY, serializeFocus(session.entryId, next));
  };

  useEffect(() => {
    if (lastPhase.current === focusPhaseKey(state)) return;
    onPhaseEnd?.();
    update(state);
  });

  // Save from the start, so a reload finds the mode this session began with.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only once, when the timer mounts
  useEffect(() => update(state), []);

  return {
    state,
    now,
    clock: focusClock(state, session.startedAt, now),
    restMs: focusRestMs(state, now),
    update,
  };
}

/**
 * Finishes the running session and opens its share card at once. Not `mutate` callbacks: the
 * optimistic update closes the form before the result arrives. A failure closes the card.
 */
export function useFinishFocusSession(session: ActiveSession) {
  const finish = useFinishSession();
  const setRecap = useFocusStore((store) => store.setRecap);
  return {
    isPending: finish.isPending,
    submit: (
      input: { page: number; note?: UpdateNoteInput; readingMs: number; restMs: number },
      onError: (error: unknown) => void,
    ) => {
      const page = session.pageCount ? Math.min(input.page, session.pageCount) : input.page;
      setRecap(buildSessionRecap(session, page, input.readingMs));
      finish.mutateAsync({ page, note: input.note, restMs: input.restMs }).catch((error) => {
        setRecap(null);
        onError(error);
      });
    },
  };
}
