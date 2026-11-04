import type { ShelfItem } from "@grimo/client";
import { coverUrl, spineLook } from "@grimo/core";
import { useSearch } from "@tanstack/react-router";
import { BookPeekLink } from "@/features/books";
import { cn } from "@/utils/cn";

const SPINE_TONES = [
  "bg-surface-muted text-text",
  "bg-primary text-surface",
  "bg-text text-surface",
  "border border-border bg-surface text-text",
];

/**
 * The shelf as a row of book spines standing on a plank. The cover art is the spine; on hover
 * (or while open in the peek) the book slides out to show the whole cover, with its title.
 */
export function ShelfSpines({ items }: { items: ShelfItem[] }) {
  const { book: openBook } = useSearch({ strict: false }) as { book?: string };

  return (
    <ul className="flex items-end gap-1 overflow-x-auto overflow-y-hidden border-b-[6px] border-border px-3 pt-10 pb-0 shadow-[0_8px_12px_-8px_rgb(0_0_0/0.45)]">
      {items.map(({ entry, book }) => {
        const look = spineLook(book.title, book.pageCount);
        const open = book.openLibraryId === openBook;
        const openWidth = Math.round(look.height * 0.68);
        const spine = (
          <span
            className={cn(
              "group/spine relative block overflow-hidden rounded-t-[3px] shadow-[inset_-3px_0_4px_rgb(0_0_0/0.2),inset_2px_0_2px_rgb(255_255_255/0.15)] transition-[width,transform] duration-300 ease-out",
              "w-(--spine-w) group-hover:w-(--open-w) group-focus-visible:w-(--open-w)",
              open && "w-(--open-w)",
              !book.coverUrl && SPINE_TONES[look.variant],
              !book.coverUrl && "bg-surface-muted",
            )}
            style={
              {
                "--spine-w": `${look.width}px`,
                "--open-w": `${openWidth}px`,
                height: look.height,
                ...(book.coverUrl && {
                  backgroundImage: `url(${coverUrl(book.coverUrl, "M")})`,
                  backgroundSize: "auto 100%",
                  backgroundPosition: "left center",
                }),
              } as React.CSSProperties
            }
          >
            {!book.coverUrl && (
              <span className="absolute inset-0 flex items-center justify-center p-2 font-serif text-sm font-semibold [writing-mode:vertical-rl] group-hover:[writing-mode:horizontal-tb]">
                {book.title}
              </span>
            )}
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-t from-black/85 via-black/60 to-transparent px-3 pt-10 pb-3 text-white opacity-0 transition-opacity duration-200",
                "group-hover:opacity-100 group-focus-visible:opacity-100",
                open && "opacity-100",
              )}
            >
              <span className="line-clamp-2 font-serif text-sm leading-tight font-semibold">
                {book.title}
              </span>
              <span className="truncate font-mono text-[10px] uppercase opacity-80">
                {book.authors.join(", ")}
              </span>
            </span>
          </span>
        );
        return (
          <li key={entry.id} className="shrink-0">
            {book.openLibraryId ? (
              <BookPeekLink
                openLibraryId={book.openLibraryId}
                className="group block outline-none"
                aria-label={`${book.title}, ${book.authors.join(", ")}`}
              >
                {spine}
              </BookPeekLink>
            ) : (
              <div className="group">{spine}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
