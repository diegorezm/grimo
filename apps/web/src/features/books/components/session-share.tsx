import { useFocusStore, useMe, useStreak } from "@grimo/client";
import {
  READING_SCENES,
  type ReadingScene as Scene,
  type SessionRecap,
  sessionRecapStats,
  sessionShareText,
  streakLabel,
} from "@grimo/core";
import { cardPalettes } from "@grimo/tokens";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardCover, downloadCard, StoryCanvas, shareCard } from "@/features/stats";
import { useReadingScene } from "@/lib/reading-scene";
import { cn } from "@/utils/cn";
import { launchFireworks } from "@/utils/fireworks";
import { ReadingScene } from "./reading-scene";

const FORMATS = {
  story: { label: "Stories", width: 1080, height: 1920, scale: 0.24 },
  square: { label: "Quadrado", width: 1080, height: 1080, scale: 0.34 },
} as const;
type Format = keyof typeof FORMATS;

/** The image itself, at full size: the session on the picture it was read with. */
function SessionCard({
  recap,
  scene,
  streakDays,
  username,
  format,
}: {
  recap: SessionRecap;
  scene: Scene;
  streakDays: number;
  username: string | null;
  format: Format;
}) {
  const story = format === "story";
  return (
    <div
      data-reading-scene={scene}
      className="relative flex size-full flex-col justify-between overflow-hidden bg-surface text-text"
      style={{ padding: 80 }}
    >
      <ReadingScene scene={scene} paused preview />
      <p className="relative font-mono uppercase" style={{ fontSize: 30, letterSpacing: "0.2em" }}>
        Grimo · Sessão de leitura
      </p>
      <div className="relative flex flex-col" style={{ gap: story ? 48 : 28 }}>
        <CardCover
          book={{ ...recap, rating: null }}
          width={story ? 360 : 200}
          palette={cardPalettes.brasa}
        />
        <p
          className="font-serif font-medium"
          style={{ fontSize: story ? 112 : 84, lineHeight: 1.05 }}
        >
          {sessionRecapStats(recap)}
        </p>
        <div>
          <p className="font-serif italic" style={{ fontSize: 56, lineHeight: 1.15 }}>
            {recap.title}
          </p>
          <p style={{ fontSize: 34, marginTop: 8 }}>{recap.authors.join(", ")}</p>
        </div>
        {streakDays > 1 && (
          <p className="font-mono uppercase" style={{ fontSize: 30, letterSpacing: "0.1em" }}>
            Ofensiva · {streakLabel(streakDays)}
          </p>
        )}
      </div>
      <div className="relative flex items-center justify-between">
        <span className="font-serif italic" style={{ fontSize: 56 }}>
          ✦ grimo
        </span>
        {username && (
          <span className="font-mono" style={{ fontSize: 32, letterSpacing: "0.1em" }}>
            @{username}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * After saving a session: the card to post it, always the reader's own click. On phones sharing
 * opens the system sheet; on desktop it downloads, and "Postar no X" opens the post with the text
 * (the X link can't attach images).
 */
export default function SessionShare({ recap }: { recap: SessionRecap }) {
  const setRecap = useFocusStore((store) => store.setRecap);
  const username = useMe().data?.username ?? null;
  const streakDays = useStreak().data?.days ?? 0;
  // Starts on the timer's theme; changing it here only changes this image.
  const [scene, setScene] = useState<Scene>(useReadingScene());
  const canvas = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<Format>("story");
  const [showUsername, setShowUsername] = useState(true);
  const [edited, setEdited] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const text = edited ?? sessionShareText(recap, streakDays);
  const close = () => setRecap(null);
  const size = FORMATS[format];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRecap(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setRecap]);

  useEffect(() => launchFireworks(), []);

  async function run(action: typeof shareCard) {
    if (!canvas.current) return;
    setBusy(true);
    setFailed(false);
    try {
      await action(canvas.current, `grimo-sessao-${format}.png`);
    } catch (error) {
      // Closing the system share sheet is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-share-title"
        className="flex w-full max-w-3xl flex-col gap-6 rounded-xl border border-border bg-surface p-6 text-text shadow-xl sm:flex-row"
      >
        <div className="flex shrink-0 justify-center">
          <StoryCanvas
            ref={canvas}
            scale={size.scale}
            width={size.width}
            height={size.height}
            className="rounded-lg shadow-md shadow-shadow"
          >
            <SessionCard
              recap={recap}
              scene={scene}
              streakDays={streakDays}
              username={showUsername ? username : null}
              format={format}
            />
          </StoryCanvas>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="session-share-title" className="text-2xl font-medium italic">
              {recap.lastPage ? "Última página!" : "Sessão salva"}
            </h2>
            <p className="text-text-muted">Quer compartilhar? Só sai daqui se você postar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMATS) as Format[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={format === option}
                onClick={() => setFormat(option)}
                className={cn(
                  "rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition",
                  format === option
                    ? "border-accent bg-surface-muted"
                    : "border-border text-text-muted hover:border-accent/50",
                )}
              >
                {FORMATS[option].label}
              </button>
            ))}
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Tema da imagem
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(READING_SCENES) as Scene[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={scene === option}
                  onClick={() => setScene(option)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition",
                    scene === option
                      ? "border-accent bg-surface-muted"
                      : "border-border text-text-muted hover:border-accent/50",
                  )}
                >
                  {READING_SCENES[option]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showUsername}
              onChange={(e) => setShowUsername(e.target.checked)}
            />
            Mostrar meu @ na imagem
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setEdited(e.target.value);
              setCopied(false);
            }}
            rows={3}
            aria-label="Texto para postar"
            className="w-full resize-none rounded-md border border-border bg-transparent p-3 text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run(shareCard)} disabled={busy}>
              Compartilhar
            </Button>
            <Button variant="secondary" onClick={() => run(downloadCard)} disabled={busy}>
              Baixar imagem
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={copy}
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
            >
              {copied ? "Copiado" : "Copiar texto"}
            </button>
            <a
              href={`https://x.com/intent/post?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
            >
              Postar no X
            </a>
            <button
              type="button"
              onClick={close}
              className="ml-auto font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
            >
              Agora não
            </button>
          </div>
          {failed && (
            <p role="alert" className="text-sm text-danger">
              Não deu certo. Tente de novo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
