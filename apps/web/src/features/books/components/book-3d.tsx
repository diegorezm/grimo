import { cn } from "@/utils/cn";
import { BookCover } from "./book-cover";

/**
 * A standing book: cover with a shaded spine, a block of pages below and an optional ribbon
 * bookmark. Width comes from `className` (height follows the 2:3 cover).
 */
export function Book3D({
  src,
  title,
  ribbon = true,
  className,
}: {
  src: string | null;
  title: string;
  ribbon?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative w-32 pb-2.5", className)}>
      {/* Page block peeking out under the cover. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-1.5 bottom-0 h-4 rounded-b-sm border border-edge bg-surface [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_2px,var(--color-border)_2px,var(--color-border)_3px)]"
      />
      <div className="relative overflow-hidden rounded-l-sm rounded-r-md shadow-lg shadow-shadow">
        <BookCover src={src} title={title} className="w-full rounded-none" />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-3 bg-linear-to-r from-black/30 via-white/15 to-transparent"
        />
      </div>
      {ribbon && <span aria-hidden="true" className="ribbon absolute right-4 -bottom-3 h-8 w-3" />}
    </div>
  );
}
