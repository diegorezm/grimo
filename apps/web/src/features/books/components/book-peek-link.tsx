import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";

/** Opens a book in the side peek, keeping the current screen (and its scroll) behind it. */
export function BookPeekLink({
  openLibraryId,
  className,
  style,
  children,
  "aria-label": ariaLabel,
}: {
  openLibraryId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, book: openLibraryId, post: undefined })}
      resetScroll={false}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
