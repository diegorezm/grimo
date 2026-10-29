import { useAddToShelf, useBookSearch, useShelf } from "@grimo/client";
import { SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from "@grimo/core";
import { useDeferredValue, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { SearchIcon } from "@/components/ui/icons";
import { BookCard } from "./book-card";
import { ManualBookForm } from "./manual-book-form";

const SUGGESTIONS = [
  "Duna",
  "Clarice Lispector",
  "Machado de Assis",
  "Brandon Sanderson",
  "Ursula K. Le Guin",
  "Agatha Christie",
];

/** Search bar + grid of results; each result can go straight to a shelf. */
export function BookSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);
  const search = useBookSearch(deferred);
  const addToShelf = useAddToShelf();
  // Which of the results are already on one of my shelves.
  const mine = new Map(
    (useShelf().data?.items ?? []).map(({ entry, book }) => [book.openLibraryId, entry.status]),
  );
  const results = search.data?.items ?? [];
  const [adding, setAdding] = useState(false);
  const searched = !search.isFetching && deferred.trim().length >= 2;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <label className="flex max-w-2xl items-center gap-3 rounded-full bg-surface-muted px-5 py-3.5 focus-within:ring-2 focus-within:ring-accent/40">
          <SearchIcon className="text-text-muted" />
          <input
            // biome-ignore lint/a11y/noAutofocus: search is the whole point of this screen
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título, autor ou ISBN"
            aria-label="Buscar livros"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
          />
        </label>
        {query.trim().length < 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Experimente:
            </span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-border px-3.5 py-1 text-sm transition hover:bg-surface-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {search.isFetching && results.length === 0 && <Spinner label="Buscando…" />}
      {searched && results.length === 0 && (
        <p className="pt-10 text-center text-text-muted">Nada encontrado para “{deferred}”.</p>
      )}

      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-x-8">
        {results.map((book) => {
          const status = mine.get(book.openLibraryId);
          return (
            <li key={book.openLibraryId}>
              <BookCard book={book} ribbon={false}>
                {book.publishedYear && (
                  <p className="font-mono text-[11px] text-text-muted">{book.publishedYear}</p>
                )}
                <select
                  value={status ?? ""}
                  aria-label={`Adicionar ${book.title} a uma estante`}
                  onChange={(e) =>
                    addToShelf.mutate({ book, status: e.target.value as ShelfStatus })
                  }
                  className={
                    status
                      ? "mt-2.5 w-full rounded-full border border-border bg-surface-muted px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider outline-none"
                      : "bg-accent-gradient mt-2.5 w-full rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-accent-foreground outline-none"
                  }
                >
                  <option value="" disabled>
                    + Adicionar
                  </option>
                  {SHELF_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {SHELF_LABELS[s]}
                    </option>
                  ))}
                </select>
              </BookCard>
            </li>
          );
        })}
      </ul>

      {searched &&
        (adding ? (
          <ManualBookForm initialTitle={deferred.trim()} onCancel={() => setAdding(false)} />
        ) : (
          <p className="text-center text-sm text-text-muted">
            Não achou o livro?{" "}
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              Cadastre ele
            </button>
          </p>
        ))}
    </div>
  );
}
