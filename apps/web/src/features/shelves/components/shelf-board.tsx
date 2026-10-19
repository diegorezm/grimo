import { type ShelfItem, useShelf, useShelfTabStore, useUpdateShelfEntry } from "@grimo/client";
import { countByShelf, SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Stars } from "@/components/ui/stars";
import { BookCard, PageLogger } from "@/features/books";
import { ShelfTiles } from "./shelf-tiles";

/** All shelves: tiles on top pick the shelf; its books stand in a grid below. */
export function ShelfBoard() {
  const { status, setStatus } = useShelfTabStore();
  const shelf = useShelf();

  if (shelf.isPending) return <Spinner />;
  const items = shelf.data?.items ?? [];
  const counts = countByShelf(items.map(({ entry }) => entry));
  const visible = items.filter(({ entry }) => entry.status === status);

  return (
    <div className="flex flex-col gap-9">
      <ShelfTiles counts={counts} selected={status} onSelect={setStatus} />

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-14 text-center text-text-muted">
          Nenhum livro em “{SHELF_LABELS[status]}”.{" "}
          <Link
            to="/search"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            Buscar livros
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-x-8">
          {visible.map((item) => (
            <li key={item.entry.id}>
              <ShelfBook item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShelfBook({ item: { entry, book } }: { item: ShelfItem }) {
  const update = useUpdateShelfEntry();

  return (
    <BookCard book={book} ribbon={entry.status === "reading"}>
      {entry.status === "reading" && (
        <div className="mt-2">
          <PageLogger
            entryId={entry.id}
            page={entry.currentPage}
            pageCount={book.pageCount}
            compact
          />
        </div>
      )}
      {entry.status === "read" && (
        <Stars
          rating={entry.rating}
          onChange={(rating) => update.mutate({ id: entry.id, rating })}
          className="mt-1.5"
        />
      )}
      <select
        value={entry.status}
        aria-label={`Mover ${book.title} de estante`}
        onChange={(e) =>
          update.mutate({
            id: entry.id,
            status: e.target.value as (typeof SHELF_STATUSES)[number],
          })
        }
        className="mt-2.5 w-full rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-text-muted outline-none hover:text-text focus:border-accent"
      >
        {SHELF_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SHELF_LABELS[s]}
          </option>
        ))}
      </select>
    </BookCard>
  );
}
