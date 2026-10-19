import { useUpdateShelfEntry } from "@grimo/client";
import { readingPercent } from "@grimo/core";
import { type CSSProperties, useEffect, useState } from "react";
import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

const QUICK_STEPS = [5, 10, 25];

/**
 * Log reading progress: drag the slider, tap a "+N" chip, or click the page number to type it.
 * Saves when you let go (optimistic). At the last page it offers to move the book to "Lidos".
 * `compact` is the small version for shelf cards.
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
  useEffect(() => setDraft(page), [page]);

  const clamp = (value: number) => Math.max(0, pageCount ? Math.min(pageCount, value) : value) || 0;
  const save = (value: number) => {
    const next = clamp(value);
    setDraft(next);
    if (next !== page) update.mutate({ id: entryId, currentPage: next });
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
      </div>
    </div>
  );
}
