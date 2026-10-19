import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Book3D } from "./book-3d";
import { BookPeekLink } from "./book-peek-link";

/**
 * Standing book with title and author below; `children` adds shelf-specific details.
 * `relative` keeps absolutely positioned children (e.g. `sr-only` text) inside scroll rows.
 */
export function BookCard({
  book,
  ribbon,
  className,
  children,
}: {
  /** With `openLibraryId`, the cover and title open the book in the side peek. */
  book: { title: string; authors: string[]; coverUrl: string | null; openLibraryId?: string };
  ribbon?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative flex h-full min-w-0 flex-col", className)}>
      {book.openLibraryId ? (
        <BookPeekLink openLibraryId={book.openLibraryId} className="group flex flex-col">
          <Book3D
            src={book.coverUrl}
            title={book.title}
            ribbon={ribbon}
            className="w-full transition group-hover:-translate-y-1"
          />
          <p className="mt-5 line-clamp-2 font-serif font-medium leading-snug group-hover:underline">
            {book.title}
          </p>
        </BookPeekLink>
      ) : (
        <>
          <Book3D src={book.coverUrl} title={book.title} ribbon={ribbon} className="w-full" />
          <p className="mt-5 line-clamp-2 font-serif font-medium leading-snug">{book.title}</p>
        </>
      )}
      <p className="truncate text-sm text-accent italic">{book.authors.join(", ")}</p>
      {/* Pinned to the bottom so controls line up across a row of uneven titles. */}
      {children && <div className="mt-auto flex flex-col">{children}</div>}
    </div>
  );
}
