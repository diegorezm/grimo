import type { ShelfItem } from "@grimo/client";
import { readingPercent, SHELF_LABELS, type ShelfStatus } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Stars } from "@/components/ui/stars";
import { BookCard } from "@/features/books";

/** Horizontal row of standing books from one shelf, with progress or rating under each. */
export function ShelfCarousel({ status, items }: { status: ShelfStatus; items: ShelfItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * 320, behavior: "smooth" });

  return (
    <section aria-labelledby="carousel-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="carousel-title" className="text-2xl font-medium italic">
          {SHELF_LABELS[status]}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            to="/shelves"
            className="rounded-full border border-border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            Ver todos
          </Link>
          <CarouselButton label="Anteriores" onClick={() => scroll(-1)}>
            <ChevronLeftIcon className="size-4" />
          </CarouselButton>
          <CarouselButton label="Próximos" onClick={() => scroll(1)}>
            <ChevronRightIcon className="size-4" />
          </CarouselButton>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-text-muted">
          Nenhum livro aqui ainda.{" "}
          <Link
            to="/search"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            Buscar livros
          </Link>
        </p>
      ) : (
        <ul
          ref={track}
          className="-mx-1 flex snap-x gap-7 overflow-x-auto px-1 pt-1 pb-5 [scrollbar-width:none]"
        >
          {items.map(({ entry, book }) => {
            const percent = readingPercent(entry.currentPage, book.pageCount);
            return (
              <li key={entry.id} className="w-36 shrink-0 snap-start">
                <BookCard book={book} ribbon={status === "reading"}>
                  {status === "reading" && percent !== null && (
                    <ProgressBar percent={percent} className="mt-2" />
                  )}
                  {status === "read" && entry.rating && (
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

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-border text-text-muted transition hover:bg-surface-muted hover:text-text"
    >
      {children}
    </button>
  );
}
