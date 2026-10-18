import { useShelf, useShelfTabStore, useUpdateShelfEntry } from "@grimo/client";
import { SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import { Spinner } from "@/components/feedback/spinner";
import { Card } from "@/components/ui/card";
import { BookCover } from "@/features/books";
import { cn } from "@/utils/cn";

export function ShelfBoard() {
  const { status, setStatus } = useShelfTabStore();
  const shelf = useShelf(status);
  const update = useUpdateShelfEntry();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto">
        {SHELF_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-sm",
              s === status ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            {SHELF_LABELS[s]}
          </button>
        ))}
      </div>

      {shelf.isPending && <Spinner />}
      {shelf.data?.items.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">Nenhum livro aqui ainda.</p>
      )}
      {shelf.data?.items.map(({ entry, book }) => (
        <Card key={entry.id} className="flex gap-3">
          <BookCover src={book.coverUrl} title={book.title} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-serif font-medium">{book.title}</p>
            <p className="truncate text-sm text-text-muted">{book.authors.join(", ")}</p>
            {entry.status === "reading" && (
              <label className="mt-auto flex items-center gap-2 text-xs text-text-muted">
                Página
                <input
                  type="number"
                  min={0}
                  max={book.pageCount ?? undefined}
                  defaultValue={entry.currentPage}
                  className="w-20 rounded-md border border-border bg-surface px-2 py-1"
                  onBlur={(e) =>
                    update.mutate({ id: entry.id, currentPage: Number(e.target.value) })
                  }
                />
                {book.pageCount && `de ${book.pageCount}`}
              </label>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
