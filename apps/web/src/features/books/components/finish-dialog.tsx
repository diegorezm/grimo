import { type BookDetail, toast, useUpdateShelfEntry } from "@grimo/client";
import {
  editionPages,
  type Feeling,
  firstIssue,
  formatRating,
  shelfMoveMessage,
  updateNoteSchema,
} from "@grimo/core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeelingPicker } from "@/components/ui/feelings";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/utils/cn";

const DAY_MS = 24 * 60 * 60 * 1000;
const WHEN = [
  { label: "Hoje", daysAgo: 0 },
  { label: "Ontem", daysAgo: 1 },
] as const;

/**
 * "Terminou?": moving a book to Lidos is a moment, not a click (the web twin of mobile's
 * `FinishSheet`). The date, the rating, how it made you feel (suggested from the reading diary),
 * a line about it and whether the feed hears about it, then one "Concluir leitura".
 */
export function FinishDialog({ detail, onClose }: { detail: BookDetail; onClose: () => void }) {
  const update = useUpdateShelfEntry();
  const navigate = useNavigate();
  const { book, diary } = detail;
  const entry = detail.entry!;
  const [daysAgo, setDaysAgo] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [feelings, setFeelings] = useState<Feeling[] | null>(null);
  const [comment, setComment] = useState("");
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chosenRating = rating ?? entry.rating;
  // Until the reader picks, the feelings the diary marked most are already chosen.
  const chosenFeelings = feelings ?? (entry.feelings.length > 0 ? entry.feelings : diary.suggested);
  const pages = editionPages(entry.pageCount, book.pageCount);

  function conclude() {
    let note: { body: string; hasSpoilers: boolean } | undefined;
    if (publish && comment.trim() !== "") {
      const parsed = updateNoteSchema.safeParse({ body: comment, hasSpoilers: false });
      if (!parsed.success) return setError(firstIssue(parsed.error));
      note = parsed.data;
    }
    const input = {
      id: entry.id,
      status: "read" as const,
      finishedAt: new Date(Date.now() - daysAgo * DAY_MS),
      ...(pages ? { currentPage: pages } : {}),
      rating: chosenRating,
      feelings: chosenFeelings,
      publish,
      ...(note && { note }),
    };
    const send = () => update.mutate(input, { onError: (failure) => toast.failed(failure, send) });
    send();
    onClose();
    toast.saved(
      [
        shelfMoveMessage(book.title, "read"),
        chosenRating !== null && `nota ${formatRating(chosenRating)}`,
        !publish && "sem publicar",
      ]
        .filter(Boolean)
        .join(" · "),
      {
        label: "Card",
        run: () =>
          void navigate({
            to: "/card/livro/$openLibraryId",
            params: { openLibraryId: book.openLibraryId },
          }),
      },
    );
  }

  return (
    <Dialog title={`Terminou ${book.title}?`} onClose={onClose} className="max-w-lg">
      <p className="-mt-3 font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
        Mover para Lidos
      </p>

      <div className="flex items-center justify-between gap-3">
        <span>Terminei</span>
        <div className="flex gap-2">
          {WHEN.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={daysAgo === option.daysAgo}
              onClick={() => setDaysAgo(option.daysAgo)}
              className={cn(
                "min-h-10 rounded-full border px-4 font-mono text-xs tracking-wider uppercase transition",
                daysAgo === option.daysAgo
                  ? "border-2 border-accent bg-glow-b text-text"
                  : "border-border text-text-muted hover:text-text",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
          Sua nota{chosenRating !== null ? ` · ${formatRating(chosenRating)}` : ""}
        </span>
        <Stars rating={chosenRating} onChange={setRating} className="text-4xl" />
      </div>

      <FeelingPicker value={chosenFeelings} suggested={diary.suggested} onChange={setFeelings} />

      <label className="flex items-center justify-between gap-3">
        <span>Publicar no feed dos seus seguidores</span>
        <input
          type="checkbox"
          checked={publish}
          onChange={(event) => setPublish(event.target.checked)}
          className="size-5 accent-accent"
        />
      </label>
      {publish && (
        <textarea
          value={comment}
          onChange={(event) => {
            setError(null);
            setComment(event.target.value);
          }}
          rows={2}
          placeholder="Uma frase sobre o livro (opcional)"
          aria-label="Uma frase sobre o livro"
          className="w-full resize-none rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-text-muted focus:border-accent"
        />
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Agora não
        </Button>
        <Button onClick={conclude}>Concluir leitura</Button>
      </div>
    </Dialog>
  );
}
