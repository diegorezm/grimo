/**
 * The full-screen reading timer: a pomodoro or a free stopwatch on top of a reading session.
 * The session (on the server) only knows when it started; this state says what the clock shows
 * and how much of that time was not reading. All timestamps, so it survives a reload.
 */
export const FOCUS_MODES = {
  classic: { label: "Clássico", detail: "25 / 5", readingMs: 25 * 60_000, breakMs: 5 * 60_000 },
  long: { label: "Longo", detail: "50 / 10", readingMs: 50 * 60_000, breakMs: 10 * 60_000 },
  free: { label: "Livre", detail: "sem limite", readingMs: null, breakMs: null },
} as const;

export type FocusMode = keyof typeof FOCUS_MODES;
export const isFocusMode = (value: unknown): value is FocusMode =>
  typeof value === "string" && Object.hasOwn(FOCUS_MODES, value);

export interface FocusState {
  mode: FocusMode;
  phase: "reading" | "break";
  phaseStartedAt: number;
  pausedAt: number | null;
  /** 1 for the first reading block. */
  cycle: number;
  /** Finished breaks and pauses, in ms. */
  restMs: number;
}

export const startFocus = (mode: FocusMode, at: number): FocusState => ({
  mode,
  phase: "reading",
  phaseStartedAt: at,
  pausedAt: null,
  cycle: 1,
  restMs: 0,
});

const phaseLength = (state: FocusState) =>
  FOCUS_MODES[state.mode][state.phase === "reading" ? "readingMs" : "breakMs"];

function nextPhase(state: FocusState, at: number): FocusState {
  return state.phase === "reading"
    ? { ...state, phase: "break", phaseStartedAt: at }
    : {
        ...state,
        phase: "reading",
        phaseStartedAt: at,
        cycle: state.cycle + 1,
        restMs: state.restMs + (at - state.phaseStartedAt),
      };
}

/** Moves through every phase that ended by `now` (the tab may have been closed meanwhile). */
export function settleFocus(state: FocusState, now: number): FocusState {
  let current = state;
  while (current.pausedAt === null) {
    const length = phaseLength(current);
    if (length === null || now < current.phaseStartedAt + length) break;
    current = nextPhase(current, current.phaseStartedAt + length);
  }
  return current;
}

export const pauseFocus = (state: FocusState, now: number): FocusState =>
  state.pausedAt === null ? { ...state, pausedAt: now } : state;

export function resumeFocus(state: FocusState, now: number): FocusState {
  if (state.pausedAt === null) return state;
  const paused = now - state.pausedAt;
  return {
    ...state,
    pausedAt: null,
    phaseStartedAt: state.phaseStartedAt + paused,
    restMs: state.restMs + paused,
  };
}

/** "Pular": ends the phase now. */
export const skipFocusPhase = (state: FocusState, now: number): FocusState =>
  nextPhase(resumeFocus(state, now), now);

/** Time so far that was not reading: finished rest, the current break and the current pause. */
export function focusRestMs(state: FocusState, now: number): number {
  const end = state.pausedAt ?? now;
  const inBreak = state.phase === "break" ? Math.max(0, end - state.phaseStartedAt) : 0;
  const inPause = state.pausedAt === null ? 0 : Math.max(0, now - state.pausedAt);
  return state.restMs + inBreak + inPause;
}

/** Another mode starts a new reading block; the rest so far still counts. */
export const changeFocusMode = (state: FocusState, mode: FocusMode, now: number): FocusState => ({
  ...startFocus(mode, now),
  restMs: focusRestMs(state, now),
});

/** What the clock shows. `remainingMs` is null in the free mode, which shows `readingMs`. */
export function focusClock(state: FocusState, sessionStartedAt: number, now: number) {
  const length = phaseLength(state);
  const spent = Math.max(0, (state.pausedAt ?? now) - state.phaseStartedAt);
  return {
    remainingMs: length === null ? null : Math.max(0, length - spent),
    progress: length === null ? null : Math.min(1, spent / length),
    readingMs: Math.max(0, now - sessionStartedAt - focusRestMs(state, now)),
  };
}

/** Changes when a phase ends: compare it to notice the end and ring. */
export const focusPhaseKey = (state: FocusState) => `${state.phase}:${state.cycle}`;

/** A saved timer older than the session belongs to a previous one on the same book. */
const SAME_SESSION_MARGIN_MS = 60_000;

/** Whether a timer belongs to this running session. */
export const isFocusOfSession = (state: FocusState, session: { startedAt: number }) =>
  state.phaseStartedAt >= session.startedAt - SAME_SESSION_MARGIN_MS;

export const serializeFocus = (entryId: string, state: FocusState) =>
  JSON.stringify({ entryId, state });

/**
 * The timer saved on this device for this session, or a new one in the reader's last mode.
 * Anything unreadable just starts over.
 */
export function restoreFocus(
  saved: string | null,
  lastMode: string | null,
  session: { entryId: string; startedAt: number },
): FocusState {
  try {
    const parsed = JSON.parse(saved ?? "null");
    if (
      parsed?.entryId === session.entryId &&
      isFocusMode(parsed.state?.mode) &&
      isFocusOfSession(parsed.state, session)
    ) {
      return parsed.state;
    }
  } catch {
    // Start over, below.
  }
  return startFocus(isFocusMode(lastMode) ? lastMode : "classic", session.startedAt);
}

/** The themes behind the reading timer (web: `ReadingScene`). */
export const READING_SCENES = {
  forest: "Floresta",
  rain: "Chuva",
  night: "Noite",
  ocean: "Mar",
  cozy: "Aconchego",
  window: "Janela",
  sunset: "Entardecer",
  none: "Sem tema",
} as const;

export type ReadingScene = keyof typeof READING_SCENES;
export const isReadingScene = (value: unknown): value is ReadingScene =>
  typeof value === "string" && Object.hasOwn(READING_SCENES, value);
