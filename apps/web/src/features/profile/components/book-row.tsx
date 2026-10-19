import type { ShelfItem } from "@grimo/client";
import { readingPercent } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Stars } from "@/components/ui/stars";
import { BookCard } from "@/features/books";

/**
 * A titled, horizontally scrolling row of books (progress for reads in progress, stars
 * otherwise). `shelfLink` adds "Ver estante" (your own profile).
 */
export function BookRow({
  title,
  items,
  empty,
  shelfLink = false,
}: {
  title: string;
  items: ShelfItem[];
  empty: string;
  shelfLink?: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-medium italic">{title}</h2>
        {shelfLink && (
          <Link
            to="/shelves"
            className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
          >
            Ver estante →
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-text-muted">
          {empty}
        </p>
      ) : (
        <ul className="-mx-1 flex snap-x gap-6 overflow-x-auto px-1 pt-1 pb-4 [scrollbar-width:thin]">
          {items.map(({ entry, book }) => {
            const percent = readingPercent(entry.currentPage, book.pageCount);
            return (
              <li key={entry.id} className="w-32 shrink-0 snap-start">
                <BookCard book={book} ribbon={entry.status === "reading"}>
                  {entry.status === "reading" && percent !== null && (
                    <ProgressBar percent={percent} className="mt-2" />
                  )}
                  {entry.status === "read" && entry.rating && (
                    <Stars rating={entry.rating} className="mt-1.5" />
                  )}
                </BookCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
