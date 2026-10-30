import { PANEL_PAGE_SIZE } from "@grimo/client";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/** Pages to show as buttons: first, last, the current one and its neighbours, with gaps. */
function pageButtons(page: number, pages: number): (number | "gap")[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const n of numbers) {
    if (previous && n - previous > 1) out.push("gap");
    out.push(n);
    previous = n;
  }
  return out;
}

/**
 * Numbered pages for a panel list: "Mostrando 11–20 de 26", « Anterior, 1 … 4 5 6 … 9, Próxima ».
 * `capped` means the backend stopped counting at its cap, so the total reads "500+".
 */
export function Pager({
  page,
  pages,
  total,
  capped = false,
  pageSize = PANEL_PAGE_SIZE,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  capped?: boolean;
  pageSize?: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const step = "grid size-9 place-items-center rounded-full font-mono text-xs transition";

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        Mostrando {from}–{to} de {total}
        {capped && "+"}
      </p>
      {pages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
              className={cn(step, "text-text-muted hover:bg-surface-muted disabled:opacity-40")}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          </li>
          {pageButtons(page, pages).map((item, index) =>
            item === "gap" ? (
              <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-text-muted">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  aria-label={`Página ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPage(item)}
                  className={cn(
                    step,
                    item === page
                      ? "bg-accent-gradient font-medium text-accent-foreground shadow-md shadow-accent/30"
                      : "text-text-muted hover:bg-surface-muted hover:text-text",
                  )}
                >
                  {item}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              aria-label="Próxima página"
              disabled={page >= pages}
              onClick={() => onPage(page + 1)}
              className={cn(step, "text-text-muted hover:bg-surface-muted disabled:opacity-40")}
            >
              <ChevronLeftIcon className="size-4 rotate-180" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
