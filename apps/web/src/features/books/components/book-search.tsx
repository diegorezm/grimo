import {
  type BookSearchResult,
  bookInputOf,
  useAddToShelf,
  useBookSearch,
  usePopularBooks,
  useShelf,
} from "@grimo/client";
import {
  bookSearchTerm,
  popularReadersLabel,
  SEARCH_GENRES,
  type SearchGenre,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  searchSuggestions,
} from "@grimo/core";
import type { ReactNode } from "react";
import { useDeferredValue, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { BookCard } from "./book-card";
import { ManualBookForm } from "./manual-book-form";

const GENRE_SCROLL = 280;
const GENRE_ARROW =
  "hidden size-8 shrink-0 place-items-center rounded-full border border-border text-text-muted transition hover:border-accent hover:text-accent sm:grid";

/**
 * Search bar + grid of results; each result can go straight to a shelf. With nothing typed yet,
 * suggests authors and shows "Em alta no Grimo".
 */
export function BookSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState<SearchGenre | null>(null);
  const deferred = useDeferredValue(query);
  const term = bookSearchTerm(deferred, genre);
  const search = useBookSearch(term);
  const popular = usePopularBooks().data?.items ?? [];
  // Which of the results are already on one of my shelves.
  const mine = new Map(
    (useShelf().data?.items ?? []).map(({ entry, book }) => [book.openLibraryId, entry.status]),
  );
  const results = search.data?.items ?? [];
  const [adding, setAdding] = useState(false);
  const genreLabel = SEARCH_GENRES.find((option) => option.id === genre)?.label;
  const typing = query.trim().length >= 2 || genre !== null;
  const suggestions = searchSuggestions(popular.flatMap(({ book }) => book.authors));
  const searched = !search.isFetching && term.length >= 2;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 rounded-full bg-surface-muted px-5 py-3.5 focus-within:ring-2 focus-within:ring-accent/40">
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
        <GenreFilter value={genre} onChange={setGenre} />
        {!typing && (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1 text-sm text-text-muted">
            <span className="font-mono text-[11px] uppercase tracking-wider">Experimente</span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="underline-offset-4 transition hover:text-accent hover:underline"
              >
                {suggestion}
              </button>
            ))}
          </p>
        )}
      </div>

      {search.isFetching && results.length === 0 && <Spinner label="Buscando…" />}
      {searched && results.length === 0 && (
        <p className="pt-10 text-center text-text-muted">
          Nada encontrado{deferred.trim() ? ` para “${deferred.trim()}”` : ""}
          {genre ? " neste gênero" : ""}.
        </p>
      )}

      {typing ? (
        <section aria-labelledby="results-title" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="results-title" className="text-2xl font-medium italic">
              {genreLabel ?? "Resultados"}
            </h2>
            {genreLabel && (
              <button
                type="button"
                onClick={() => setGenre(null)}
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
              >
                Limpar filtro
              </button>
            )}
          </div>
          <BookGrid>
            {results.map((book) => (
              <SearchResult
                key={book.openLibraryId}
                book={book}
                status={mine.get(book.openLibraryId)}
                detail={
                  book.publishedYear && (
                    <p className="font-mono text-[11px] text-text-muted">{book.publishedYear}</p>
                  )
                }
              />
            ))}
          </BookGrid>
        </section>
      ) : (
        popular.length > 0 && (
          <section aria-labelledby="popular-title" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 id="popular-title" className="text-2xl font-medium italic">
                Em alta no Grimo
              </h2>
              <p className="text-sm text-text-muted">
                O que mais gente está lendo nos últimos 30 dias.
              </p>
            </div>
            <BookGrid>
              {popular.map(({ book, readers }) => (
                <SearchResult
                  key={book.openLibraryId}
                  book={bookInputOf(book)}
                  status={mine.get(book.openLibraryId)}
                  detail={
                    <p className="font-mono text-[11px] text-text-muted">
                      {popularReadersLabel(readers)}
                    </p>
                  }
                />
              ))}
            </BookGrid>
          </section>
        )
      )}

      {searched &&
        deferred.trim().length >= 2 &&
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

/** One line of genres that scrolls sideways, with arrows where there is a mouse. */
function GenreFilter({
  value,
  onChange,
}: {
  value: SearchGenre | null;
  onChange: (genre: SearchGenre | null) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) =>
    row.current?.scrollBy({ left: direction * GENRE_SCROLL, behavior: "smooth" });
  return (
    <fieldset className="flex min-w-0 items-center gap-2">
      <legend className="sr-only">Filtrar por gênero</legend>
      <button
        type="button"
        aria-label="Gêneros anteriores"
        onClick={() => scroll(-1)}
        className={GENRE_ARROW}
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <div ref={row} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
        {SEARCH_GENRES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(value === option.id ? null : option.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition",
              value === option.id
                ? "border-accent bg-surface-muted text-text"
                : "border-border text-text-muted hover:border-accent/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Próximos gêneros"
        onClick={() => scroll(1)}
        className={GENRE_ARROW}
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </fieldset>
  );
}

function BookGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-x-8">
      {children}
    </ul>
  );
}

function SearchResult({
  book,
  status,
  detail,
}: {
  book: BookSearchResult;
  status: ShelfStatus | undefined;
  detail: ReactNode;
}) {
  const addToShelf = useAddToShelf();
  return (
    <li>
      <BookCard book={book} ribbon={false}>
        {detail}
        <Select<ShelfStatus | "">
          value={status ?? ""}
          label={`Adicionar ${book.title} a uma estante`}
          placeholder="+ Adicionar"
          variant={status ? "compact" : "accent"}
          className="mt-2.5"
          options={SHELF_STATUSES.map((s) => ({ value: s, label: SHELF_LABELS[s] }))}
          onChange={(next) => next && addToShelf.mutate({ book, status: next })}
        />
      </BookCard>
    </li>
  );
}
