import { toast, useMyShelves, useSetShelfBooks, useShelf } from "@grimo/client";
import { cn } from "@/utils/cn";
import { useShelfNaming } from "./shelf-naming";

/**
 * "Suas estantes" on a book page: the shelves you made, each a chip to put this book on it or
 * take it off, and "+ Nova estante" (with the book already on it).
 */
export function EntryTags({ entryId }: { entryId: string }) {
  const shelves = useMyShelves().data?.items ?? [];
  // The shelf list holds the entry's shelves and is patched at once when one is toggled.
  const on = new Set<string>(
    useShelf().data?.items.find((item) => item.entry.id === entryId)?.entry.tagIds ?? [],
  );
  const setBooks = useSetShelfBooks();
  const naming = useShelfNaming();

  function toggle(shelf: (typeof shelves)[number]) {
    const next = !on.has(shelf.id);
    setBooks.mutate(
      { shelfId: shelf.id, entryIds: [entryId], on: next },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(next ? `Na estante ${shelf.name}` : `Saiu da estante ${shelf.name}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
        Suas estantes
      </p>
      <div className="flex flex-wrap gap-2">
        {shelves.map((shelf) => (
          <button
            key={shelf.id}
            type="button"
            aria-pressed={on.has(shelf.id)}
            onClick={() => toggle(shelf)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-sm transition",
              on.has(shelf.id)
                ? "border-accent bg-surface-muted font-semibold"
                : "border-border hover:border-accent/50",
            )}
          >
            {shelf.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => naming.askNew([entryId])}
          className="min-h-9 rounded-full border border-dashed border-border px-3.5 text-sm text-accent-ink transition hover:border-accent"
        >
          + Nova estante
        </button>
      </div>
      {naming.dialog}
    </div>
  );
}
