import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Opens a book in the side peek, keeping the current screen (and its scroll) behind it. */
export function BookPeekLink({
  openLibraryId,
  className,
  children,
}: {
  openLibraryId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, book: openLibraryId })}
      resetScroll={false}
      className={className}
    >
      {children}
    </Link>
  );
}
