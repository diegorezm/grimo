import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

/** Lying books, top to bottom (width, color). */
const stack = [
  ["w-36", "bg-shelf-read-fg"],
  ["w-40", "bg-accent"],
  ["w-32", "bg-shelf-want-to-read-fg"],
  ["w-38", "bg-shelf-reading-fg"],
  ["w-34", "bg-accent-start"],
  ["w-40", "bg-shelf-abandoned-fg"],
] as const;

/** Decorative pile of books with a ribbon and a sparkle. `large` doubles the scale. */
export function BookStack({ large = false, className }: { large?: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 flex-col items-center",
        large && "origin-center scale-150",
        className,
      )}
    >
      <Sparkle className="absolute -top-2 -right-3 size-5" />
      {stack.map(([width, color], i) => (
        <span
          key={color}
          className={cn(
            "h-7 rounded-[3px] border-r-[6px] border-surface shadow-sm shadow-shadow",
            width,
            color,
            i % 2 === 1 ? "translate-x-2" : "-translate-x-1",
          )}
        />
      ))}
      <span className="ribbon absolute top-7 left-8 h-12 w-3" />
    </div>
  );
}
