import { errorMessage, useUpdateShelfEntry } from "@grimo/client";
import { firstIssue, readingPercent, updateNoteSchema } from "@grimo/core";
import { type CSSProperties, useEffect, useState } from "react";
import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

const QUICK_STEPS = [5, 10, 25];

/**
 * Log reading progress: drag the slider, tap a "+N" chip, or click the page number to type it.
 * Saves when you let go (optimistic). At the last page it offers to move the book to "Lidos".
 * "Comentar" (like Skoob's comentário de leitura) holds the page until you publish it with a
 * note, which shows in the feed. `compact` is the small version for shelf cards.
 */
export function PageLogger({
  entryId,
  page,
  pageCount,
  compact = false,
}: {
  entryId: string;
  page: number;
  pageCount: number | null;
  compact?: boolean;
}) {
  const update = useUpdateShelfEntry();
  const [draft, setDraft] = useState(page);
  const [editing, setEditing] = useState(false);
  /** The note being written; null while the composer is closed. */
  const [note, setNote] = useState<{ body: string; hasSpoilers: boolean } | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  useEffect(() => setDraft(page), [page]);

  const clamp = (value: number) => Math.max(0, pageCount ? Math.min(pageCount, value) : value) || 0;
  const save = (value: number) => {
    const next = clamp(value);
    setDraft(next);
    // While writing a note, the page waits to go out with it.
    if (next !== page && !note) update.mutate({ id: entryId, currentPage: next });
  };
  const publish = () => {
    if (!note) return;
    const input = updateNoteSchema.safeParse(note);
    if (!input.success) return setNoteError(firstIssue(input.error));
    if (draft === page) return setNoteError("Marque a página nova antes de publicar.");
    setNoteError(null);
    update.mutate(
      { id: entryId, currentPage: draft, note: input.data },
      {
        onSuccess: () => setNote(null),
        onError: (error) => setNoteError(errorMessage(error)),
      },
    );
  };
  const percent = readingPercent(draft, pageCount);
  const finished = pageCount !== null && draft >= pageCount;

  const number = editing ? (
    <input
      // biome-ignore lint/a11y/noAutofocus: opened by clicking the number to edit it
      autoFocus
      type="number"
      min={0}
      max={pageCount ?? undefined}
      defaultValue={draft}
      aria-label="Página atual"
      onBlur={(e) => {
        setEditing(false);
        save(Number(e.target.value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setEditing(false);
      }}
      className={cn(
        "rounded-md border border-accent bg-surface text-center font-serif font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
        compact ? "w-14 text-sm" : "w-24 text-3xl",
      )}
    />
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Clique para digitar a página"
      className={cn(
        "rounded-md font-serif font-medium underline decoration-border decoration-dotted underline-offset-4 transition hover:text-accent hover:decoration-accent",
        compact ? "text-sm" : "text-3xl",
      )}
    >
      {draft}
    </button>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {pageCount && (
          <input
            type="range"
            min={0}
            max={pageCount}
            value={draft}
            aria-label="Página atual"
            onChange={(e) => setDraft(Number(e.target.value))}
            onPointerUp={(e) => save(Number(e.currentTarget.value))}
            onKeyUp={(e) => save(Number(e.currentTarget.value))}
            className="range-reading h-1.5 w-full"
            style={{ "--progress": `${percent ?? 0}%` } as CSSProperties}
          />
        )}
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-text-muted">
          <span>
            p. {number}
            {pageCount && ` / ${pageCount}`}
          </span>
          <button
            type="button"
            onClick={() => save(draft + 10)}
            disabled={finished}
            className="rounded-full border border-border px-2 py-0.5 transition hover:border-accent hover:text-accent disabled:opacity-40"
          >
            +10
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="flex items-baseline gap-2 text-text-muted">
          <span className="text-sm">Página</span>
          {number}
          {pageCount && <span className="text-sm">de {pageCount}</span>}
        </p>
        {percent !== null && (
          <p className="text-right">
            <span className="font-serif text-2xl font-medium text-accent">{percent}%</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {finished ? "última página!" : `faltam ${pageCount! - draft} páginas`}
            </span>
          </p>
        )}
      </div>

      {pageCount && (
        <input
          type="range"
          min={0}
          max={pageCount}
          value={draft}
          aria-label="Página atual"
          onChange={(e) => setDraft(Number(e.target.value))}
          onPointerUp={(e) => save(Number(e.currentTarget.value))}
          onKeyUp={(e) => save(Number(e.currentTarget.value))}
          className="range-reading w-full"
          style={{ "--progress": `${percent ?? 0}%` } as CSSProperties}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Li mais
        </span>
        {QUICK_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => save(draft + step)}
            disabled={finished}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-xs transition hover:-translate-y-0.5 hover:border-accent hover:text-accent disabled:opacity-40"
          >
            +{step}
          </button>
        ))}
        {finished && (
          <button
            type="button"
            onClick={() => update.mutate({ id: entryId, status: "read" })}
            className="bg-accent-gradient ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
          >
            <Sparkle className="size-3.5" />
            Terminei!
          </button>
        )}
        {!note && (
          <button
            type="button"
            onClick={() => setNote({ body: "", hasSpoilers: false })}
            className={cn(
              "rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted transition hover:text-accent",
              !finished && "ml-auto",
            )}
          >
            Comentar
          </button>
        )}
      </div>

      {note && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <textarea
            // biome-ignore lint/a11y/noAutofocus: opened by clicking "Comentar"
            autoFocus
            value={note.body}
            onChange={(e) => setNote({ ...note, body: e.target.value })}
            rows={3}
            maxLength={2000}
            placeholder="O que achou até aqui? Aparece no feed junto da página."
            aria-label="Comentário sobre a leitura"
            className="w-full resize-y bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={note.hasSpoilers}
                onChange={(e) => setNote({ ...note, hasSpoilers: e.target.checked })}
              />
              Tem spoiler
            </label>
            <button
              type="button"
              onClick={() => {
                setNote(null);
                setNoteError(null);
                // The page moved while writing: save it without the note.
                if (draft !== page) update.mutate({ id: entryId, currentPage: draft });
              }}
              className="ml-auto font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={update.isPending}
              className="bg-accent-gradient rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent-foreground disabled:opacity-50"
            >
              Publicar na página {draft}
            </button>
          </div>
          {noteError && <p className="text-sm text-danger">{noteError}</p>}
        </div>
      )}
    </div>
  );
}
