import type { ShelfItem } from "@grimo/client";
import { readingPercent, SHELF_LABELS, type ShelfStatus } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Book3D } from "@/features/books";

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
          {items.map(({ entry, book }) => (
            <li key={entry.id} className="flex w-36 shrink-0 snap-start flex-col">
              <Book3D
                src={book.coverUrl}
                title={book.title}
                ribbon={status === "reading"}
                className="w-full"
              />
              <p className="mt-5 line-clamp-2 font-serif font-medium leading-snug">{book.title}</p>
              <p className="truncate text-sm text-accent italic">{book.authors.join(", ")}</p>
              {status === "reading" && (
                <Progress percent={readingPercent(entry.currentPage, book.pageCount)} />
              )}
              {status === "read" && entry.rating && <Stars rating={entry.rating} />}
            </li>
          ))}
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
  children: React.ReactNode;
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

function Progress({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div className="bg-accent-gradient h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="font-mono text-[11px] font-semibold text-accent">{percent}%</span>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <p className="mt-1.5 text-sm tracking-wider text-gold">
      <span className="sr-only">Nota {rating} de 5</span>
      <span aria-hidden="true">
        {"★".repeat(rating)}
        <span className="text-border">{"★".repeat(5 - rating)}</span>
      </span>
    </p>
  );
}
