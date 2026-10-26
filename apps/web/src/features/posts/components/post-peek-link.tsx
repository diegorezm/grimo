import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Opens a post and its comments in the side peek, keeping the current screen behind it. */
export function PostPeekLink({
  postId,
  className,
  children,
}: {
  postId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, post: postId, book: undefined, panel: undefined })}
      resetScroll={false}
      className={className}
    >
      {children}
    </Link>
  );
}
