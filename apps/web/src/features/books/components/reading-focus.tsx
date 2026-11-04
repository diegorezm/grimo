import {
  type ActiveSession,
  errorMessage,
  useActiveSession,
  useDiscardSession,
  useElapsed,
  useFinishSession,
  useFocusStore,
} from "@grimo/client";
import {
  changeFocusMode,
  FOCUS_MODES,
  type FocusMode,
  type FocusState,
  firstIssue,
  focusClock,
  focusRestMs,
  formatMinutes,
  formatTimer,
  isFocusMode,
  pauseFocus,
  resumeFocus,
  type ReadingScene as Scene,
  settleFocus,
  skipFocusPhase,
  startFocus,
  updateNoteSchema,
} from "@grimo/core";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
  SkipIcon,
  TimerIcon,
  WindIcon,
} from "@/components/ui/icons";
import { setReadingScene, useReadingScene } from "@/lib/reading-scene";
import { cn } from "@/utils/cn";
import { BookCover } from "./book-cover";
import { ReadingScene, useSceneSound } from "./reading-scene";
import { SceneGallery } from "./scene-gallery";

const STATE_KEY = "grimo:reading-focus";
const MODE_KEY = "grimo:reading-focus-mode";
const RING_RADIUS = 46;
const VISIBLE_DOTS = 8;
/** A saved timer older than the session belongs to a previous one on the same book. */
const SAME_SESSION_MARGIN_MS = 60_000;

/** Storage may be blocked (private window): the timer then just lasts until a reload. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not fatal, see `read`.
  }
}

function loadState(session: ActiveSession): FocusState {
  try {
    const saved = JSON.parse(read(STATE_KEY) ?? "null");
    if (
      saved?.entryId === session.entryId &&
      isFocusMode(saved.state?.mode) &&
      isCurrent(saved.state, session)
    ) {
      return saved.state;
    }
  } catch {
    // Unreadable: start over.
  }
  const mode = read(MODE_KEY);
  return startFocus(isFocusMode(mode) ? mode : "classic", session.startedAt);
}

/** A soft two-note chime when a phase ends. */
function chime() {
  try {
    const audio = new AudioContext();
    [660, 880].forEach((frequency, index) => {
      const at = audio.currentTime + index * 0.22;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.12, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.65);
    });
  } catch {
    // No audio here: the screen still changes.
  }
}

const phaseKeyOf = (state: FocusState) => `${state.phase}:${state.cycle}`;

/**
 * The running reading session takes over the screen: a pomodoro (or free stopwatch) with the book.
 * Mounted in the app layout, so it comes back on reload and from any page. Minimized, the timer
 * keeps going (and ringing) in a small clock in the corner.
 */
export function ReadingFocus() {
  const session = useActiveSession().data;
  if (!session) return null;
  return <FocusTimer key={session.entryId} session={session} />;
}

function isCurrent(state: FocusState, session: ActiveSession) {
  return state.phaseStartedAt >= session.startedAt - SAME_SESSION_MARGIN_MS;
}

function FocusTimer({ session }: { session: ActiveSession }) {
  const minimized = useFocusStore((store) => store.minimized);
  const timer = useFocusStore((store) => store.timer);
  const setTimer = useFocusStore((store) => store.setTimer);
  useElapsed(session.startedAt);
  const now = Date.now();
  const stored =
    timer?.entryId === session.entryId && isCurrent(timer.state, session)
      ? timer.state
      : loadState(session);
  const state = settleFocus(stored, now);
  const clock = focusClock(state, session.startedAt, now);
  const lastPhase = useRef(phaseKeyOf(state));
  const scene = useReadingScene();
  const sound = useSceneSound(scene);

  const update = (next: FocusState) => {
    lastPhase.current = phaseKeyOf(next);
    setTimer({ entryId: session.entryId, state: next });
    write(STATE_KEY, JSON.stringify({ entryId: session.entryId, state: next }));
  };

  // A phase ended by itself: ring, and save what it moved to.
  useEffect(() => {
    if (lastPhase.current === phaseKeyOf(state)) return;
    chime();
    update(state);
  });

  // Save from the start, so a reload finds the mode this session began with.
  useEffect(() => update(state), []);

  if (minimized)
    return <FocusCornerClock state={state} shownMs={clock.remainingMs ?? clock.readingMs} />;
  return (
    <FocusScreen
      session={session}
      state={state}
      clock={clock}
      now={now}
      update={update}
      sound={sound}
    />
  );
}

const phaseLabel = (state: FocusState) =>
  state.pausedAt !== null ? "Pausado" : state.phase === "break" ? "Pausa" : "Lendo";

/** The minimized timer: stays above the phone tab bar, and a click opens the full screen again. */
function FocusCornerClock({ state, shownMs }: { state: FocusState; shownMs: number }) {
  const setMinimized = useFocusStore((store) => store.setMinimized);
  const reading = state.phase === "reading" && state.pausedAt === null;
  const remaining = FOCUS_MODES[state.mode].readingMs !== null;
  return (
    <button
      type="button"
      onClick={() => setMinimized(false)}
      aria-label={`${phaseLabel(state)}: ${formatTimer(shownMs)}${remaining ? " restantes" : ""}. Abrir o timer`}
      className="glass fixed right-4 bottom-24 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-text transition hover:-translate-y-0.5 lg:right-6 lg:bottom-6"
    >
      <TimerIcon className={cn("size-4", reading ? "text-accent" : "text-text-muted")} />
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {phaseLabel(state)}
      </span>
      <span className="font-mono text-sm font-medium tabular-nums">{formatTimer(shownMs)}</span>
    </button>
  );
}

function FocusScreen({
  session,
  state,
  clock,
  now,
  update,
  sound,
}: {
  session: ActiveSession;
  state: FocusState;
  clock: ReturnType<typeof focusClock>;
  now: number;
  update: (next: FocusState) => void;
  sound: ReturnType<typeof useSceneSound>;
}) {
  const setMinimized = useFocusStore((store) => store.setMinimized);
  const scene = useReadingScene();
  const [finishing, setFinishing] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (picking) setPicking(false);
      else setMinimized(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picking, setMinimized]);

  // The page behind must not scroll: its scrollbar would stay beside the timer.
  useEffect(() => {
    const root = document.documentElement;
    const rootOverflow = root.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);

  const paused = state.pausedAt !== null;
  const inBreak = state.phase === "break";
  const circumference = 2 * Math.PI * RING_RADIUS;

  const chooseMode = (mode: FocusMode) => {
    write(MODE_KEY, mode);
    update(changeFocusMode(state, mode, Date.now()));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sessão de leitura"
      data-reading-scene={scene}
      className="fixed inset-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto bg-surface text-text [scrollbar-width:none]"
    >
      <ReadingScene scene={scene} paused={paused} />
      <header className="relative flex items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <BookCover src={session.book.coverUrl} title={session.book.title} className="w-10" />
          <p className="min-w-0">
            <span className="block truncate font-serif text-lg">{session.book.title}</span>
            <span className="block truncate text-sm text-text-muted">
              {session.book.authors.join(", ")}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-text-muted transition hover:border-accent hover:text-accent"
          >
            Temas
          </button>
          {scene !== "none" && (
            <button
              type="button"
              aria-pressed={sound.on}
              aria-label="Som do tema"
              title="Som do tema"
              onClick={sound.toggle}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border bg-surface transition hover:border-accent hover:text-accent",
                sound.on ? "border-accent text-accent" : "border-border text-text-muted",
              )}
            >
              <WindIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-text-muted transition hover:border-accent hover:text-accent"
          >
            <ChevronDownIcon className="size-4" />
            Minimizar
          </button>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-10">
        {finishing ? (
          <FinishForm
            session={session}
            readingMs={clock.readingMs}
            restMs={focusRestMs(state, now)}
            onBack={() => setFinishing(false)}
          />
        ) : (
          <>
            <div className="@container relative aspect-square w-full min-w-44 max-w-[min(80vw,calc(100dvh-27rem))]">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="2"
                  className="stroke-border"
                />
                {clock.progress !== null && (
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * clock.progress}
                    className={inBreak ? "stroke-text-muted" : "stroke-accent"}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span
                  className={cn(
                    "font-mono text-xs uppercase tracking-[0.2em]",
                    inBreak || paused ? "text-text-muted" : "text-accent",
                  )}
                >
                  {phaseLabel(state)}
                </span>
                <span
                  role="timer"
                  className="font-serif text-[20cqw] leading-none font-medium tabular-nums"
                >
                  {formatTimer(clock.remainingMs ?? clock.readingMs)}
                </span>
                <span className="text-sm text-text-muted">
                  {clock.readingMs < 60_000
                    ? "começando"
                    : `${formatMinutes(clock.readingMs / 60_000)} de leitura`}
                </span>
              </div>
            </div>

            {state.mode !== "free" && (
              <div
                role="img"
                aria-label={`Ciclo ${state.cycle}`}
                className="flex items-center gap-2"
              >
                {Array.from({ length: Math.max(VISIBLE_DOTS, state.cycle) }, (_, position) => (
                  <span
                    key={position}
                    className={cn(
                      "size-2.5 rounded-full border",
                      position < state.cycle ? "border-accent bg-accent" : "border-border",
                    )}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                className="min-w-40"
                onClick={() => {
                  const at = Date.now();
                  update(paused ? resumeFocus(state, at) : pauseFocus(state, at));
                }}
              >
                {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
                {paused ? "Continuar" : "Pausar"}
              </Button>
              {state.mode !== "free" && (
                <button
                  type="button"
                  aria-label={inBreak ? "Pular a pausa" : "Pular para a pausa"}
                  title={inBreak ? "Pular a pausa" : "Pular para a pausa"}
                  onClick={() => update(skipFocusPhase(state, Date.now()))}
                  className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition hover:border-accent hover:text-accent"
                >
                  <SkipIcon className="size-4" />
                </button>
              )}
            </div>

            <fieldset className="grid w-full max-w-md grid-cols-3 gap-2">
              <legend className="sr-only">Modo do timer</legend>
              {(Object.keys(FOCUS_MODES) as FocusMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={state.mode === mode}
                  onClick={() => state.mode !== mode && chooseMode(mode)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-center font-mono text-xs transition",
                    state.mode === mode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-text-muted hover:border-accent hover:text-accent",
                  )}
                >
                  <span className="block font-medium">{FOCUS_MODES[mode].label}</span>
                  <span className="block text-[10px] opacity-75">{FOCUS_MODES[mode].detail}</span>
                </button>
              ))}
            </fieldset>

            <button
              type="button"
              onClick={() => setFinishing(true)}
              className="font-mono text-xs uppercase tracking-wider text-text-muted underline-offset-4 transition hover:text-text hover:underline"
            >
              Terminar sessão
            </button>
          </>
        )}
      </main>
      {picking && <ScenePicker scene={scene} sound={sound} onClose={() => setPicking(false)} />}
    </div>
  );
}

/** "Temas": a dialog over the timer to choose the theme and its sound, then save or cancel. */
function ScenePicker({
  scene,
  sound,
  onClose,
}: {
  scene: Scene;
  sound: ReturnType<typeof useSceneSound>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(scene);
  const [soundOn, setSoundOn] = useState(sound.on);

  // In a portal: out of the timer's painted palette, it keeps the app's look.
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-picker-title"
        className="flex w-full max-w-3xl flex-col gap-5 rounded-xl border border-border bg-surface p-6 text-text shadow-xl"
      >
        <div className="flex flex-col gap-2">
          <h2 id="scene-picker-title" className="text-2xl font-medium italic">
            Temas
          </h2>
          <p className="text-text-muted">O cenário atrás do timer enquanto você lê.</p>
        </div>
        <SceneGallery value={draft} onChange={setDraft} />
        {draft !== "none" && (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => setSoundOn(e.target.checked)}
            />
            Tocar o som do tema
          </label>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setReadingScene(draft);
              // Clicking Save is the gesture browsers ask for before playing sound.
              if (soundOn !== sound.on) sound.toggle();
              onClose();
            }}
          >
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FinishForm({
  session,
  readingMs,
  restMs,
  onBack,
}: {
  session: ActiveSession;
  readingMs: number;
  restMs: number;
  onBack: () => void;
}) {
  const finish = useFinishSession();
  const discard = useDiscardSession();
  const [page, setPage] = useState(String(session.startPage));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pageCount } = session;

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(page);
    if (!Number.isInteger(value) || value < 0) return setError("Página inválida");
    let parsedNote: { body: string; hasSpoilers: boolean } | undefined;
    if (note.trim()) {
      const input = updateNoteSchema.safeParse({ body: note, hasSpoilers: false });
      if (!input.success) return setError(firstIssue(input.error));
      parsedNote = input.data;
    }
    setError(null);
    finish.mutate(
      { page: pageCount ? Math.min(value, pageCount) : value, note: parsedNote, restMs },
      { onError: (failure) => setError(errorMessage(failure)) },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-md flex-col gap-4">
      <p className="text-center">
        <span className="block font-serif text-5xl font-medium">
          {formatMinutes(readingMs / 60_000)}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          de leitura
        </span>
      </p>
      <label className="flex items-center justify-center gap-3 text-sm text-text-muted">
        Parei na página
        <input
          // biome-ignore lint/a11y/noAutofocus: the one thing this step asks
          autoFocus
          value={page}
          onChange={(e) => setPage(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          aria-label="Página onde parou"
          className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-center text-text outline-none focus:border-accent"
        />
        {pageCount && <span>de {pageCount}</span>}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Comentar a leitura (opcional): aparece no feed"
        aria-label="Comentário sobre a sessão"
        className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm outline-none placeholder:text-text-muted focus:border-accent"
      />
      <Button type="submit" disabled={finish.isPending} className="w-full">
        Salvar sessão
      </Button>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
        >
          Voltar ao timer
        </button>
        <button
          type="button"
          onClick={() => discard.mutate()}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-danger"
        >
          Descartar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
