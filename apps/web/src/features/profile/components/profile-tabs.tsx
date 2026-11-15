import { type ReaderPage, useProfileShelves, useReaderShelves } from "@grimo/client";
import { coverUrl, DEFAULT_PROFILE_SHOWS, editionPages, readingPercent } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookCover, BookPeekLink } from "@/features/books";
import { cn } from "@/utils/cn";

const TABS = [
  { id: "shelves", label: "Estantes" },
  { id: "activity", label: "Atividade" },
  { id: "year", label: "Ano" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * The bottom of a profile, one part at a time (the web twin of mobile's `ProfileTabs`): the
 * shelves (previews that open the whole shelf), what the reader posted (`activity`) and the year
 * (`year`). The route passes the last two, from their features. The highlights (mobile's
 * "Destaques" tab) sit in the profile's side column instead (`ProfileFeatured`).
 */
export function ProfileTabs({
  username,
  isMe,
  activity,
  year,
}: {
  username: string;
  /** Your own profile: an empty shelf invites you to make one. */
  isMe: boolean;
  activity: ReactNode;
  year: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("shelves");
  const reader = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  const shelfCount =
    (reader && reader.reading.count > 0 ? 1 : 0) +
    (reader && reader.read.count > 0 ? 1 : 0) +
    made.length;

  return (
    <section className="flex flex-col gap-6">
      <div role="tablist" aria-label="Perfil" className="flex border-b border-edge">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 px-4 py-3 font-mono text-xs tracking-wider uppercase transition",
                active
                  ? "border-text text-text"
                  : "border-transparent text-text-muted hover:text-text",
              )}
            >
              {item.label}
              {item.id === "shelves" && shelfCount > 0 && (
                <span className="text-text-muted">{shelfCount}</span>
              )}
            </button>
          );
        })}
      </div>
      {tab === "shelves" && <ProfileShelves username={username} isMe={isMe} />}
      {tab === "activity" && activity}
      {tab === "year" && year}
    </section>
  );
}

/** Covers in a preview, side by side on a plank. */
const PREVIEW_BOOKS = 10;

/**
 * Lendo, Lidos and the shelves the reader made, each a preview of covers with its count; the
 * title opens the whole shelf (in the owner's style).
 */
function ProfileShelves({ username, isMe }: { username: string; isMe: boolean }) {
  const shelves = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  if (!shelves) return null;
  const { reading, read } = shelves;
  const previews = [
    ...(reading.count > 0
      ? [{ key: "reading", name: "Lendo", count: reading.count, books: reading.items }]
      : []),
    ...(read.count > 0
      ? [
          {
            key: "read",
            name: "Lidos",
            count: read.count,
            books: read.runs.flatMap((run) => run.items),
          },
        ]
      : []),
    ...made.map((shelf) => ({
      key: shelf.id,
      name: shelf.isPublic ? shelf.name : `${shelf.name} · só você`,
      count: shelf.count,
      books: shelf.covers,
    })),
  ];
  if (previews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <span aria-hidden="true" className="flex items-end gap-1 border-b-4 border-edge px-3">
          <span className="h-10 w-3 rounded-t-sm bg-accent-start/70" />
          <span className="h-14 w-4 rounded-t-sm bg-accent/70" />
          <span className="h-12 w-3 rounded-t-sm bg-gold/70" />
          <span className="h-11 w-3 origin-bottom-left -rotate-12 rounded-t-sm bg-ornament/70" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-serif text-xl italic">A estante ainda está vazia</p>
          <p className="max-w-sm text-sm text-text-muted">
            {isMe
              ? "Marque o que está lendo e o que já leu, e monte estantes do seu jeito: elas aparecem aqui."
              : "Quando houver livros lidos ou em leitura, eles aparecem aqui."}
          </p>
        </div>
        {isMe && (
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/search"
              className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30 hover:opacity-90"
            >
              Buscar livros
            </Link>
            <Link
              to="/shelves"
              className="rounded-full border border-border px-5 py-2.5 font-mono text-xs tracking-wider uppercase transition hover:border-accent/50"
            >
              Montar minha estante
            </Link>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {previews.map((preview) => (
        <div key={preview.key} className="flex flex-col gap-3">
          <Link
            to="/u/$username/estante/$shelf"
            params={{ username, shelf: preview.key }}
            className="group flex items-center gap-2"
          >
            <h3 className="min-w-0 flex-1 truncate text-2xl font-medium italic">{preview.name}</h3>
            <span className="flex items-center gap-1 font-mono text-xs tracking-wider text-accent-ink uppercase group-hover:underline">
              {preview.count} {preview.count === 1 ? "livro" : "livros"}
              <ChevronRightIcon className="size-4" />
            </span>
          </Link>
          {preview.books.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum livro nesta estante ainda.</p>
          ) : (
            <div>
              <ul className="flex gap-3 overflow-hidden pb-0.5">
                {preview.books.slice(0, PREVIEW_BOOKS).map((book) => (
                  <li key={book.entryId} className="w-20 shrink-0">
                    <BookPeekLink openLibraryId={book.openLibraryId} aria-label={book.title}>
                      <BookCover src={book.coverUrl} title={book.title} className="w-20" />
                    </BookPeekLink>
                  </li>
                ))}
              </ul>
              <div className="h-2 rounded-sm bg-edge" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** "Lendo agora", under the header (unless the reader hides it). */
export function ProfileReadingNow({ page }: { page: ReaderPage }) {
  const { profile, books } = page;
  const item = (profile.profileShows ?? DEFAULT_PROFILE_SHOWS).reading
    ? books.reading[0]
    : undefined;
  if (!item) return null;
  const { entry, book } = item;
  const more = books.reading.length - 1;
  const pages = editionPages(entry.pageCount, book.pageCount ?? null);
  const percent = readingPercent(entry.currentPage, pages);
  return (
    <BookPeekLink
      openLibraryId={book.openLibraryId}
      className="page flex items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5"
    >
      {book.coverUrl ? (
        <img
          src={coverUrl(book.coverUrl, "M")}
          alt=""
          className="aspect-[2/3] w-12 shrink-0 rounded-sm object-cover shadow-sm"
        />
      ) : (
        <span className="aspect-[2/3] w-12 shrink-0 rounded-sm bg-surface-muted" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
          Lendo agora{more > 0 ? ` · e mais ${more}` : ""}
        </span>
        <span className="line-clamp-2 font-serif text-lg leading-tight">{book.title}</span>
        <span className="truncate text-sm text-text-muted">
          {book.authors.join(", ")} · pág. {entry.currentPage}
          {pages ? ` de ${pages}` : ""}
        </span>
        {percent !== null && <ProgressBar percent={percent} />}
      </span>
    </BookPeekLink>
  );
}

/** Highlights in the side column: the year's goal and the streak (each one the reader can hide). */
export function ProfileFeatured({ page, streak }: { page: ReaderPage; streak?: number | null }) {
  const { profile, stats } = page;
  const goal = (profile.profileShows ?? DEFAULT_PROFILE_SHOWS).goal ? (stats?.goal ?? null) : null;
  const showStreak =
    (profile.profileShows ?? DEFAULT_PROFILE_SHOWS).streak && !!streak && streak > 0;
  if (!goal && !showStreak) return null;
  return (
    <div className="page flex flex-col gap-3 rounded-2xl p-5">
      {goal && (
        <>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
              Meta de {stats?.year}
            </span>
            <span className="font-mono text-lg">
              {goal.done} / {goal.target}
            </span>
          </div>
          <ProgressBar percent={Math.min(100, Math.round((goal.done / goal.target) * 100))} />
        </>
      )}
      <p className="text-sm text-text-muted">
        {[
          goal &&
            (goal.done >= goal.target
              ? "Meta batida."
              : `Faltam ${goal.target - goal.done} livros.`),
          showStreak && `Ofensiva de ${streak} ${streak === 1 ? "dia" : "dias"} lendo.`,
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
    </div>
  );
}
