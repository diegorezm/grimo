import { errorMessage, useModerationBooks } from "@grimo/client";
import { Link, useSearch } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { StaffBadge } from "@/components/ui/staff-badge";
import { cn } from "@/utils/cn";
import { Card, CardBanner, CardGrid } from "./card-grid";
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
          <CardGrid>
            {data.items.map((book) => (
              <Card key={book.openLibraryId} selected={book.openLibraryId === open}>
                <CardBanner
                  left="Livro cadastrado"
                  right={book.pageCount ? `${book.pageCount} páginas` : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-6 -bottom-1 flex items-end gap-0.5 text-accent"
                  >
                    <span className="h-9 w-2.5 rounded-t-[2px] bg-current opacity-60" />
                    <span className="h-12 w-3 rounded-t-[2px] bg-current" />
                    <span className="h-10 w-2.5 -rotate-6 rounded-t-[2px] bg-current opacity-80" />
                  </span>
                </CardBanner>
                <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                  <Avatar
                    src={book.addedBy?.image ?? null}
                    name={book.addedBy?.name ?? "?"}
                    size="size-14"
                    className="relative -mt-7 bg-accent-gradient text-accent-foreground shadow-md ring-4 ring-surface"
                  />
                  <div className="min-w-0">
                    <Link
                      to="."
                      search={peekSearch({ review: book.openLibraryId })}
                      resetScroll={false}
                      aria-current={book.openLibraryId === open ? "true" : undefined}
                      className="block truncate font-serif text-xl font-medium italic leading-tight after:absolute after:inset-0 after:rounded-lg group-hover:underline"
                    >
                      {book.title}
                    </Link>
                    <p className="truncate text-sm text-text-muted">
                      {book.authors.join(", ")}
                      {book.publishedYear && ` · ${book.publishedYear}`}
                    </p>
                  </div>
                  <p className="flex items-center gap-2 truncate font-mono text-[11px] text-text-muted">
                    {book.addedBy ? (
                      <>
                        por @{book.addedBy.username}
                        <StaffBadge role={book.addedBy.role} />
                      </>
                    ) : (
                      "conta excluída"
                    )}
                  </p>
                  <p
                    className={cn(
                      LABEL,
                      "mt-auto flex items-center justify-between border-t border-border pt-4",
                    )}
                  >
                    <span>{ago(book.addedAt)}</span>
                    <span className="text-accent">Revisar →</span>
                  </p>
                </div>
              </Card>
            ))}
          </CardGrid>
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
