import { bookQuery, useBook } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { BookDetailBody, BookDetailSkeleton, BookShelfActions } from "@/features/books";

/** The book page expanded from the side peek. */
export const Route = createFileRoute("/_app/books/$openLibraryId")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(bookQuery(params.openLibraryId));
  },
  component: BookPage,
});

function BookPage() {
  const { openLibraryId } = Route.useParams();
  const book = useBook(openLibraryId);
  return (
    <Screen back="Voltar">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        {book.data ? (
          <>
            <BookDetailBody detail={book.data} />
            <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface px-4 py-4 lg:-mx-8 lg:px-8">
              <BookShelfActions detail={book.data} />
            </div>
          </>
        ) : book.isError ? (
          <p className="py-10 text-center text-text-muted">Não encontramos esse livro.</p>
        ) : (
          <BookDetailSkeleton />
        )}
      </div>
    </Screen>
  );
}
