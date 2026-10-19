import { SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from "@grimo/core";
import { cn } from "@/utils/cn";
import { SHELF_BADGE } from "../shelf-badge";

/** Shelf "categories" with counts; pick which shelf the books below show. */
export function ShelfTiles({
  counts,
  selected,
  onSelect,
}: {
  counts: Record<ShelfStatus, number>;
  selected: ShelfStatus;
  onSelect: (status: ShelfStatus) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Estantes"
      className="grid grid-cols-2 gap-3 @2xl/main:grid-cols-4"
    >
      {SHELF_STATUSES.map((status) => {
        const active = status === selected;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(status)}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 text-left transition",
              active
                ? "border-edge bg-surface-muted shadow-sm shadow-shadow"
                : "border-transparent hover:bg-surface-muted/60",
            )}
          >
            <MiniShelf status={status} />
            <span className="min-w-0">
              <span className="block truncate font-serif text-base font-medium">
                {SHELF_LABELS[status]}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                {counts[status]} {counts[status] === 1 ? "livro" : "livros"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Three little spines on a shelf, in the shelf's color. */
function MiniShelf({ status }: { status: ShelfStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-12 w-12 shrink-0 items-end justify-center gap-0.5 rounded-md border px-1.5 pb-1.5",
        SHELF_BADGE[status],
      )}
    >
      <span className="h-6 w-2 rounded-[2px] bg-current opacity-60" />
      <span className="h-8 w-2.5 rounded-[2px] bg-current" />
      <span className="h-7 w-2 -rotate-12 rounded-[2px] bg-current opacity-80" />
    </span>
  );
}
