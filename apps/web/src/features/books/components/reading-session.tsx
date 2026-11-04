import {
  type ActiveSession,
  errorMessage,
  useActiveSession,
  useDiscardSession,
  useElapsed,
  useFinishSession,
  useStartSession,
} from "@grimo/client";
import { firstIssue, formatTimer, updateNoteSchema } from "@grimo/core";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookPeekLink } from "./book-peek-link";

/**
 * "Sessão de leitura": start a timer, read, then say where you stopped. The feed says "leu 40
 * páginas em 35 min" and the day counts for the streak. The timer is on the server, so it keeps
 * running with the tab closed.
 */
export function ReadingSession({
  entryId,
  page,
  pageCount,
  book,
}: {
  entryId: string;
  page: number;
  pageCount: number | null;
  book: ActiveSession["book"];
}) {
  const session = useActiveSession().data;
  const start = useStartSession();

  if (session && session.entryId !== entryId) {
    return (
      <p className="text-sm text-text-muted">
        Sessão aberta em{" "}
        <BookPeekLink
          openLibraryId={session.book.openLibraryId}
          className="font-serif italic text-text hover:underline"
        >
          {session.book.title}
        </BookPeekLink>
        .
      </p>
    );
  }
  if (session) return <RunningSession session={session} pageCount={pageCount} />;
  return (
    <Button
      variant="secondary"
      className="w-fit"
      disabled={start.isPending}
      onClick={() => start.mutate({ entryId, book, page })}
    >
      ⏱ Iniciar sessão de leitura
    </Button>
  );
}

function RunningSession({
  session,
  pageCount,
}: {
  session: ActiveSession;
  pageCount: number | null;
}) {
  const elapsed = useElapsed(session.startedAt);
  const finish = useFinishSession();
  const discard = useDiscardSession();
  const [page, setPage] = useState(String(session.startPage));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      { page: pageCount ? Math.min(value, pageCount) : value, note: parsedNote },
      { onError: (failure) => setError(errorMessage(failure)) },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-lg bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Lendo agora
        </span>
        <span className="font-serif text-4xl font-medium tabular-nums" aria-live="off">
          {formatTimer(elapsed)}
        </span>
      </div>
      <label className="flex items-center gap-3 text-sm text-text-muted">
        Parei na página
        <input
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
        rows={2}
        maxLength={2000}
        placeholder="Comentar a leitura (opcional): aparece no feed"
        aria-label="Comentário sobre a sessão"
        className="w-full resize-none rounded-md border border-border bg-transparent p-2 text-sm outline-none placeholder:text-text-muted focus:border-accent"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={finish.isPending}>
          Terminar sessão
        </Button>
        <button
          type="button"
          onClick={() => discard.mutate()}
          className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-text"
        >
          Descartar
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
