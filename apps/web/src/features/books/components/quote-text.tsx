import { cn } from "@/utils/cn";

/** A saved passage: the words in serif, between quote marks, and the page it is on. */
export function QuoteText({
  body,
  page,
  className,
}: {
  body: string;
  page: number | null;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col gap-1.5 border-l-2 border-accent pl-4", className)}>
      <blockquote className="font-serif text-lg leading-snug italic whitespace-pre-line">
        “{body}”
      </blockquote>
      {page && (
        <figcaption className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          p. {page}
        </figcaption>
      )}
    </figure>
  );
}
