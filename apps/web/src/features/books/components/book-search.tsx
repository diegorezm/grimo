import { useAddToShelf, useBookSearch } from "@grimo/client";
import { SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import { useDeferredValue, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Input } from "@/components/ui/input";
import { BookCover } from "./book-cover";

export function BookSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);
  const search = useBookSearch(deferred);
  const addToShelf = useAddToShelf();

  return (
    <div className="flex flex-col gap-4">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Título, autor ou ISBN"
      />
      {search.isFetching && <Spinner label="Buscando…" />}
      <ul className="flex flex-col gap-3">
        {search.data?.items.map((book) => (
          <li key={book.openLibraryId} className="flex gap-3">
            <BookCover src={book.coverUrl} title={book.title} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate font-serif font-medium">{book.title}</p>
              <p className="truncate text-sm text-text-muted">{book.authors.join(", ")}</p>
              <select
                className="mt-auto w-fit rounded-md border border-border bg-surface px-2 py-1 text-xs"
                defaultValue=""
                onChange={(e) =>
                  addToShelf.mutate({
                    book,
                    status: e.target.value as (typeof SHELF_STATUSES)[number],
                  })
                }
              >
                <option value="" disabled>
                  Adicionar à estante…
                </option>
                {SHELF_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SHELF_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
