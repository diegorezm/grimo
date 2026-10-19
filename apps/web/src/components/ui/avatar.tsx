import { cn } from "@/utils/cn";

/** Initial's font size for each avatar size (fallback when there is no photo). */
const INITIAL_SIZE: Record<string, string> = {
  "size-7": "text-xs",
  "size-8": "text-xs",
  "size-12": "text-lg",
  "size-16": "text-2xl",
  "size-24": "text-4xl",
  "size-28": "text-5xl",
};

/**
 * Photo or initial in a circle. `cn` does not merge conflicting classes, so size is its own
 * prop, and a custom `className` replaces the default muted look of the initial.
 */
export function Avatar({
  src,
  name,
  size = "size-10",
  className,
}: {
  src: string | null;
  name: string;
  size?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", size, className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-serif",
        size,
        INITIAL_SIZE[size] ?? "text-sm",
        className ?? "bg-surface-muted text-text-muted",
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
