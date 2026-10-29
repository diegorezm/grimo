import { useYearlySummary } from "@grimo/client";
import { retrospectiveYear } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Sparkle } from "@/components/ui/sparkle";

/** In December (and January, for the year that ended): "your year in books is ready". */
export function RetrospectiveBanner() {
  const year = retrospectiveYear(new Date());
  const { data } = useYearlySummary(year ?? undefined, { enabled: year !== null });
  if (year === null || !data || data.booksRead === 0) return null;

  return (
    <Link
      to="/card"
      search={{ year }}
      className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-surface-muted p-5 transition hover:bg-surface-muted/70"
    >
      <Sparkle className="size-8 shrink-0" />
      <span className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Retrospectiva {year}
        </span>
        <span className="font-serif text-xl italic">
          {data.booksRead} {data.booksRead === 1 ? "livro" : "livros"} e{" "}
          {data.pagesRead.toLocaleString("pt-BR")} páginas. Monte seu card do ano.
        </span>
      </span>
    </Link>
  );
}
