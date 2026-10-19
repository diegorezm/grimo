import { useBook } from "@grimo/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { ExpandIcon, SidePeek } from "@/components/layout/side-peek";
import { BookDetailBody, BookDetailSkeleton, BookShelfActions } from "./book-detail";

/** The book page as a side peek (opened with `?book=<openLibraryId>` on any screen). */
export function BookPeek({ openLibraryId }: { openLibraryId: string }) {
  const navigate = useNavigate();
  const book = useBook(openLibraryId);
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, book: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );

  return (
    <SidePeek
      label="Detalhes do livro"
      onClose={close}
      expand={
        <Link
          to="/books/$openLibraryId"
          params={{ openLibraryId }}
          aria-label="Abrir como página"
          title="Abrir como página"
          className="grid size-9 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          <ExpandIcon />
        </Link>
      }
      footer={book.data && <BookShelfActions detail={book.data} />}
    >
      {book.data ? (
        <BookDetailBody detail={book.data} />
      ) : book.isError ? (
        <p className="py-10 text-center text-text-muted">Não encontramos esse livro.</p>
      ) : (
        <BookDetailSkeleton />
      )}
    </SidePeek>
  );
}
