import { useFriendsWant } from "@grimo/client";
import { friendsWantLabel } from "@grimo/core";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { BookCard } from "@/features/books";

/** "Amigos querem ler": books the people you follow want, the most wanted first. */
export function FriendsWantRow() {
  const { data } = useFriendsWant();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="friends-want-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="friends-want-title" className="text-2xl font-medium italic">
          Amigos querem ler
        </h2>
        <p className="text-sm text-text-muted">
          O que está na estante “Quero ler” de quem você segue.
        </p>
      </div>
      <ul className="-mx-1 flex snap-x gap-7 overflow-x-auto px-1 pt-1 pb-5 [scrollbar-width:none]">
        {items.map(({ book, friends, youWant }) => (
          <li key={book.id} className="w-36 shrink-0 snap-start">
            <BookCard book={book}>
              <div className="mt-2 flex flex-col gap-1.5">
                <AvatarStack people={friends} />
                <p className="text-xs text-text-muted">
                  {friendsWantLabel(friends.map((friend) => friend.name))}
                </p>
                {youWant && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    Você também
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
