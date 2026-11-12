import { useProfileShelf } from "@grimo/client";
import { SHELF_VIEW_LABELS, SHELF_VIEWS, yearRunLabel } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { setShelfView, useShelfView } from "@/lib/shelf-view";
import { cn } from "@/utils/cn";
import { Bookcase } from "../bookcase/bookcase";

/**
 * One whole shelf of a reader, opened from their profile: their bookcase, the way they dressed
 * it. Lidos is in runs by the year each book was finished, as spines or covers.
 */
export function FullShelf({ username, shelf }: { username: string; shelf: string }) {
  const query = useProfileShelf(username, shelf);
  const view = useShelfView();
  const data = query.data;
  const byYear = shelf === "read";

  return (
    <div className="flex flex-col gap-6 px-4 pt-2 pb-10 lg:px-8 lg:pt-6">
      <Link
        to="/u/$username"
        params={{ username }}
        className="-ml-2 flex w-fit items-center gap-1 rounded-full py-1 pr-3 pl-1 font-mono text-[11px] tracking-wider text-text-muted uppercase transition hover:bg-surface-muted hover:text-text"
      >
        <ChevronLeftIcon className="size-4" />
        {data ? `Perfil de @${data.owner.username}` : "Voltar"}
      </Link>
      {query.isError && <p className="text-text-muted">Essa estante não está disponível.</p>}
      {!data && !query.isError && <Spinner />}
      {data && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-medium italic">{data.name}</h1>
              <p className="mt-1 font-mono text-xs tracking-wider text-text-muted uppercase">
                {data.count} {data.count === 1 ? "livro" : "livros"}
                {data.isPublic ? "" : " · só você vê"}
              </p>
            </div>
            {byYear && (
              <div className="flex gap-2">
                {SHELF_VIEWS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={view === option}
                    onClick={() => setShelfView(option)}
                    className={cn(
                      "min-h-9 rounded-full border px-3.5 font-mono text-xs tracking-wider uppercase transition",
                      view === option
                        ? "border-accent bg-surface-muted"
                        : "border-border text-text-muted hover:text-text",
                    )}
                  >
                    {SHELF_VIEW_LABELS[option]}
                  </button>
                ))}
              </div>
            )}
          </header>
          {data.count === 0 && <p className="text-text-muted">Nenhum livro nesta estante ainda.</p>}
          {data.runs.map((run) => (
            <section key={run.year ?? "all"} className="flex flex-col gap-3">
              {byYear && (
                <h2 className="font-mono text-xs tracking-[0.16em] text-text-muted uppercase">
                  {yearRunLabel(run.year)} · {run.items.length}
                </h2>
              )}
              <div className="overflow-hidden rounded-3xl">
                <Bookcase
                  items={run.items}
                  style={
                    byYear
                      ? { ...data.style, layout: view === "grid" ? "covers" : "standing" }
                      : data.style
                  }
                  name={byYear ? yearRunLabel(run.year) : data.name}
                />
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
