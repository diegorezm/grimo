import { errorMessage, useModerationBooks } from "@grimo/client";
import { Link, useSearch } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { StaffBadge } from "@/components/ui/staff-badge";
import { cn } from "@/utils/cn";
import { SearchField } from "./filters";
import { Pager } from "./pager";
import { ago, LABEL, peekSearch } from "./shared";

/**
 * Books readers added by hand, waiting to become public, as short cards; a click opens the
 * review (details, who added it, approve or reject) in a side peek. Search and numbered pages.
 */
export function BookReviewList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const query = useDeferredValue(search.trim());
  const books = useModerationBooks(page, query);
  const data = books.data;
  const open = useSearch({ strict: false }).review;

  useEffect(() => {
    if (data && !books.isPlaceholderData && data.page !== page) setPage(data.page);
  }, [data, books.isPlaceholderData, page]);

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-4">
      <SearchField
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Buscar por título, autor ou @ de quem cadastrou"
        label="Buscar livros"
      />
      {books.isPending ? (
        <Spinner />
      ) : books.error ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
          {errorMessage(books.error)}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
          {query ? "Nenhum livro com essa busca." : "Nenhum livro esperando revisão."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((book) => (
              <li key={book.openLibraryId}>
                <Link
                  to="."
                  search={peekSearch({ review: book.openLibraryId })}
                  resetScroll={false}
                  aria-current={book.openLibraryId === open ? "true" : undefined}
                  className={cn(
                    "page flex flex-wrap items-center gap-4 rounded-lg p-4 transition hover:bg-surface-muted/40",
                    book.openLibraryId === open && "ring-2 ring-accent",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg font-medium italic leading-tight">
                      {book.title}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      {book.authors.join(", ")}
                      {book.publishedYear && ` · ${book.publishedYear}`}
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
                      {book.addedBy ? (
                        <>
                          <Avatar src={book.addedBy.image} name={book.addedBy.name} size="size-7" />
                          @{book.addedBy.username}
                          <StaffBadge role={book.addedBy.role} />
                        </>
                      ) : (
                        "conta excluída"
                      )}
                      <span>· {ago(book.addedAt)}</span>
                    </p>
                  </div>
                  <span className={cn(LABEL, "text-accent")}>Revisar →</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pager
            page={data.page}
            pages={data.pages}
            total={data.total}
            capped={data.capped}
            onPage={(next) => {
              setPage(next);
              top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </>
      )}
    </div>
  );
}
