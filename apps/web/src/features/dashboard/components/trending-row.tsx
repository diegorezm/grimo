import { useTrending } from "@grimo/client";
import { namesLabel, SHELF_LABELS } from "@grimo/core";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { BookCard } from "@/features/books";

/** "Em alta entre quem você segue": what friends started, read and finished this month. */
export function TrendingRow() {
  const { data } = useTrending();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="trending-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="trending-title" className="text-2xl font-medium italic">
          Em alta entre quem você segue
        </h2>
        <p className="text-sm text-text-muted">
          O que seus amigos estão lendo e terminando nos últimos 30 dias.
        </p>
      </div>
      <ul className="-mx-1 flex snap-x gap-7 overflow-x-auto px-1 pt-1 pb-5 [scrollbar-width:none]">
        {items.map(({ book, friends, viewerStatus }) => (
          <li key={book.id} className="w-36 shrink-0 snap-start">
            <BookCard book={book}>
              <div className="mt-2 flex flex-col gap-1.5">
                <AvatarStack people={friends} />
                <p className="text-xs text-text-muted">
                  {namesLabel(friends.map((friend) => friend.name))}
                </p>
                {viewerStatus && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    {SHELF_LABELS[viewerStatus]}
                  </p>
                )}
              </div>
            </BookCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
