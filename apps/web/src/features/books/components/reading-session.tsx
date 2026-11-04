import {
  type ActiveSession,
  useActiveSession,
  useElapsed,
  useFocusStore,
  useStartSession,
} from "@grimo/client";
import { formatTimer } from "@grimo/core";
import { Button } from "@/components/ui/button";
import { TimerIcon } from "@/components/ui/icons";
import { BookPeekLink } from "./book-peek-link";

/**
 * "Sessão de leitura": starts the timer, which takes over the screen (`ReadingFocus`). The timer
 * is on the server, so it keeps running with the tab closed; minimized, this is the way back.
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
  const setMinimized = useFocusStore((state) => state.setMinimized);
  const elapsed = useElapsed(session?.startedAt);

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
  if (session) {
    return (
      <Button className="w-full" onClick={() => setMinimized(false)}>
        <TimerIcon className="size-4" />
        Voltar à sessão · <span className="tabular-nums">{formatTimer(elapsed)}</span>
      </Button>
    );
  }
  return (
    <Button
      className="w-full"
      disabled={start.isPending}
      onClick={() => {
        setMinimized(false);
        start.mutate({ entryId, book, page, pageCount });
      }}
    >
      <TimerIcon className="size-4" />
      Iniciar sessão de leitura
    </Button>
  );
}
