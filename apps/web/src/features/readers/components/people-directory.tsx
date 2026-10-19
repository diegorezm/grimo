import { useReaderSearch } from "@grimo/client";
import { useDeferredValue, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { SearchIcon } from "@/components/ui/icons";
import { LoadMore } from "@/components/ui/load-more";
import { ReaderSuggestions } from "./reader-suggestions";
import { ReaderGrid, ReaderTile } from "./reader-tile";

/** Search readers by name or @username; with an empty search, shows who to follow. */
export function PeopleDirectory({
  initialQuery = "",
  onQueryChange,
}: {
  initialQuery?: string;
  /** Keeps the search in the URL (shareable, survives going back). */
  onQueryChange: (q: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const q = useDeferredValue(query.trim().replace(/^@/, ""));
  const search = useReaderSearch(q);
  const items = search.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <search>
        <label className="flex items-center gap-3 rounded-full bg-surface-muted px-5 py-3 focus-within:ring-2 focus-within:ring-accent/40">
          <SearchIcon className="text-text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onQueryChange(e.target.value.trim());
            }}
            placeholder="Nome ou @usuario"
            aria-label="Buscar leitores"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
        </label>
      </search>

      {q ? (
        <section aria-label="Resultados">
          {search.isPending ? (
            <Spinner />
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Ninguém encontrado para “{q}”.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <ReaderGrid>
                {items.map((reader) => (
                  <ReaderTile key={reader.id} reader={reader} canFollow />
                ))}
              </ReaderGrid>
              <LoadMore {...search} />
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="suggestions-title" className="flex flex-col gap-4">
          <h2 id="suggestions-title" className="text-2xl font-medium italic">
            Leitores para seguir
          </h2>
          <ReaderSuggestions />
        </section>
      )}
    </div>
  );
}
