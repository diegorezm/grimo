import {
  type BookDetail,
  useAddToShelf,
  useCreatePost,
  useRemoveFromShelf,
  useToggleLike,
  useUpdateShelfEntry,
} from "@grimo/client";
import {
  editionPages,
  GENRE_LABELS,
  type Genre,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  timeAgo,
} from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MentionText } from "@/components/ui/mention-text";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/utils/cn";
import { Book3D } from "./book-3d";
import { EditionPages } from "./edition-pages";
import { FriendsWant } from "./friends-want";
import { PageLogger } from "./page-logger";
import { StartGroup } from "./start-group";

/** Header, your reading, synopsis and reviews of a book. */
export function BookDetailBody({ detail }: { detail: BookDetail }) {
  const { book, entry, community } = detail;
  const { id: _id, description: _description, ...bookInput } = book;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Book3D
          src={book.coverUrl}
          title={book.title}
          ribbon={entry?.status === "reading"}
          className="w-36 shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl leading-tight font-medium italic sm:text-4xl">{book.title}</h1>
          <p className="text-lg text-accent italic">{book.authors.join(", ")}</p>
          <ul className="mt-1 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
            {book.publishedYear && <Chip>{book.publishedYear}</Chip>}
            {book.pageCount && <Chip>{book.pageCount} páginas</Chip>}
            {book.genres.slice(0, 3).map((genre) => (
              <Chip key={genre}>{GENRE_LABELS[genre as Genre] ?? genre}</Chip>
            ))}
          </ul>
          {community.readers > 0 && (
            <p className="text-sm text-text-muted">
              {community.averageRating !== null && (
                <span className="mr-2 text-gold">
                  ★ {community.averageRating.toLocaleString("pt-BR")}
                </span>
              )}
              {community.readers} {community.readers === 1 ? "leitor" : "leitores"} no Grimo
            </p>
          )}
          <FriendsWant friends={detail.friendsWant} />
        </div>
      </header>

      {entry && (entry.status === "reading" || entry.status === "read") && (
        <section
          aria-labelledby="my-reading"
          className="flex flex-col gap-3 rounded-xl bg-surface-muted p-5"
        >
          <h2
            id="my-reading"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"
          >
            Sua leitura
          </h2>
          {entry.status === "reading" ? (
            <PageLogger
              entryId={entry.id}
              page={entry.currentPage}
              pageCount={editionPages(entry.pageCount, book.pageCount)}
            />
          ) : (
            <RatingRow entryId={entry.id} rating={entry.rating} />
          )}
          <EditionPages entryId={entry.id} pageCount={entry.pageCount} bookPages={book.pageCount} />
        </section>
      )}

      <StartGroup book={bookInput} />

      {book.description && <Synopsis text={book.description} />}

      <Reviews detail={detail} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <li className="rounded-full border border-border px-2.5 py-0.5">{children}</li>;
}

function RatingRow({ entryId, rating }: { entryId: string; rating: number | null }) {
  const update = useUpdateShelfEntry();
  return (
    <div className="flex items-center gap-3 text-sm text-text-muted">
      Sua nota
      <Stars
        rating={rating}
        onChange={(value) => update.mutate({ id: entryId, rating: value })}
        className="text-xl"
      />
    </div>
  );
}

function Synopsis({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <section aria-labelledby="synopsis" className="flex flex-col gap-3">
      <h2 id="synopsis" className="text-2xl font-medium italic">
        Sinopse
      </h2>
      <p
        className={cn(
          "leading-relaxed whitespace-pre-line text-text/90",
          long && !open && "line-clamp-5",
        )}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-fit font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
        >
          {open ? "Mostrar menos" : "Ler mais"}
        </button>
      )}
    </section>
  );
}

function Reviews({ detail }: { detail: BookDetail }) {
  const toggleLike = useToggleLike();
  return (
    <section aria-labelledby="reviews" className="flex flex-col gap-5">
      <h2 id="reviews" className="text-2xl font-medium italic">
        Resenhas
      </h2>
      {detail.book.id ? (
        <ReviewComposer bookId={detail.book.id} />
      ) : (
        <p className="text-sm text-text-muted">Adicione à estante para escrever uma resenha.</p>
      )}
      {detail.reviews.length === 0 ? (
        <p className="text-sm text-text-muted">Ninguém resenhou este livro ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {detail.reviews.map((review) => (
            <li key={review.id} className="flex gap-3 py-5 first:pt-0">
              <Avatar src={review.author.image} name={review.author.name} size="size-9" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="flex flex-wrap items-center gap-x-2 text-sm">
                  {review.author.username ? (
                    <Link
                      to="/u/$username"
                      params={{ username: review.author.username }}
                      className="font-semibold"
                    >
                      {review.author.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{review.author.name}</span>
                  )}
                  {review.rating && <Stars rating={review.rating} />}
                  <span className="font-mono text-[10px] text-text-muted">
                    {timeAgo(new Date(review.createdAt))}
                  </span>
                </p>
                <MentionText text={review.body} className="leading-relaxed" />
                <button
                  type="button"
                  aria-pressed={review.likedByMe}
                  onClick={() => toggleLike.mutate({ postId: review.id, like: !review.likedByMe })}
                  className="w-fit font-mono text-[11px] text-text-muted hover:text-text"
                >
                  {review.likedByMe ? "♥" : "♡"} {review.likeCount}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewComposer({ bookId }: { bookId: string }) {
  const create = useCreatePost();
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    create.mutate(
      { kind: "review", bookId, rating, body: body.trim(), hasSpoilers: false },
      {
        onSuccess: () => {
          setBody("");
          setRating(null);
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="O que esse livro deixou em você?"
        aria-label="Sua resenha"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
      <div className="flex items-center justify-between gap-3">
        <Stars rating={rating} onChange={setRating} className="text-lg" />
        <Button type="submit" disabled={!body.trim() || create.isPending}>
          Publicar
        </Button>
      </div>
    </form>
  );
}

/** Shelf buttons for the pinned footer: add the book or move it between shelves. */
export function BookShelfActions({ detail }: { detail: BookDetail }) {
  const add = useAddToShelf();
  const update = useUpdateShelfEntry();
  const current = detail.entry?.status;
  const { id: _id, description: _description, ...book } = detail.book;

  function choose(status: ShelfStatus) {
    if (status === current) return;
    if (detail.entry) update.mutate({ id: detail.entry.id, status });
    else add.mutate({ book, status });
  }

  return (
    <fieldset className="flex w-full flex-wrap items-center gap-2">
      <legend className="sr-only">Estante</legend>
      <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {current ? "Na estante" : "Adicionar"}
      </span>
      {SHELF_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={status === current}
          onClick={() => choose(status)}
          disabled={add.isPending}
          className={cn(
            "rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition",
            status === current
              ? "bg-accent-gradient text-accent-foreground shadow-md shadow-accent/30"
              : "border border-border text-text-muted hover:bg-surface-muted hover:text-text",
          )}
        >
          {SHELF_LABELS[status]}
        </button>
      ))}
      {detail.entry && <RemoveFromShelf entryId={detail.entry.id} />}
    </fieldset>
  );
}

/** Placeholder while the book loads. */
export function BookDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-hidden="true">
      <div className="flex items-end gap-6">
        <div className="h-52 w-36 rounded-md bg-surface-muted" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-9 w-3/4 rounded bg-surface-muted" />
          <div className="h-5 w-1/3 rounded bg-surface-muted" />
          <div className="h-5 w-1/2 rounded bg-surface-muted" />
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-4 rounded bg-surface-muted"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

/** Takes the book off the shelf, after a second click (the page log goes with it). */
function RemoveFromShelf({ entryId }: { entryId: string }) {
  const remove = useRemoveFromShelf();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="ml-auto font-mono text-[11px] uppercase tracking-wider text-text-muted underline-offset-4 hover:text-text hover:underline"
      >
        Remover
      </button>
    );
  }
  return (
    <span className="ml-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider">
      <span className="text-text-muted">Apaga também seu histórico de páginas.</span>
      <button
        type="button"
        onClick={() => remove.mutate(entryId)}
        className="text-danger hover:underline"
      >
        Remover
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-text-muted hover:text-text"
      >
        Cancelar
      </button>
    </span>
  );
}
