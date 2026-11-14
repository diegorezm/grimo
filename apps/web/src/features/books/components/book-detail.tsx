import {
  type BookDetail,
  bookInputOf,
  toast,
  useAddToShelf,
  useCreatePost,
  useRemoveFromShelf,
  useToggleLike,
  useUpdateShelfEntry,
} from "@grimo/client";
import {
  editionPages,
  type Feeling,
  feelingsSavedMessage,
  formatRating,
  GENRE_LABELS,
  type Genre,
  ratingSavedMessage,
  rereadLabel,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  shelfMoveMessage,
  starShares,
  timeAgo,
} from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FeelingPicker, FeelingTags } from "@/components/ui/feelings";
import { MentionText } from "@/components/ui/mention-text";
import { StaffBadge } from "@/components/ui/staff-badge";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/utils/cn";
import { Book3D } from "./book-3d";
import { BookQuotes } from "./book-quotes";
import { EditionPages } from "./edition-pages";
import { EntryTags } from "./entry-tags";
import { FinishDialog } from "./finish-dialog";
import { FriendsWant } from "./friends-want";
import { OpenReads } from "./open-reads";
import { PageLogger } from "./page-logger";
import { ReadingSession } from "./reading-session";
import { StartGroup } from "./start-group";

/** Header, your reading, synopsis and reviews of a book. */
export function BookDetailBody({ detail }: { detail: BookDetail }) {
  const { book, entry, community } = detail;
  const bookInput = bookInputOf(book);

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
                <span className="mr-2 text-gold">★ {formatRating(community.averageRating)}</span>
              )}
              {community.readers} {community.readers === 1 ? "leitor" : "leitores"} no Grimo
            </p>
          )}
          <FriendsWant friends={detail.friendsWant} />
          {book.reviewStatus === "pending" && (
            <p className="text-sm text-text-muted">
              <span className="mr-2 rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider">
                Em revisão
              </span>
              Você cadastrou este livro. Só você o vê até a revisão.
            </p>
          )}
          {book.reviewStatus === "rejected" && (
            <p className="text-sm text-text-muted">
              Este cadastro não foi aprovado: o livro continua só na sua estante.
            </p>
          )}
        </div>
      </header>

      {entry && entry.status !== "want_to_read" && (
        <section
          aria-labelledby="my-reading"
          className="flex flex-col gap-3 rounded-xl bg-surface-muted p-5"
        >
          <h2
            id="my-reading"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"
          >
            Sua leitura
            {rereadLabel(entry.pastReads) && ` · ${rereadLabel(entry.pastReads)}`}
          </h2>
          {entry.status === "reading" ? (
            <>
              <PageLogger
                entryId={entry.id}
                page={entry.currentPage}
                pageCount={editionPages(entry.pageCount, book.pageCount)}
              />
              {book.id && (
                <ReadingSession
                  entryId={entry.id}
                  page={entry.currentPage}
                  pageCount={editionPages(entry.pageCount, book.pageCount)}
                  book={{
                    id: book.id,
                    openLibraryId: book.openLibraryId,
                    title: book.title,
                    authors: book.authors,
                    coverUrl: book.coverUrl,
                  }}
                />
              )}
            </>
          ) : (
            <>
              <RatingRow
                entryId={entry.id}
                rating={entry.rating}
                feelings={entry.feelings}
                suggested={detail.diary.suggested}
              />
              {entry.status === "read" && (
                <Link
                  to="/card/livro/$openLibraryId"
                  params={{ openLibraryId: book.openLibraryId }}
                  className="w-fit font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
                >
                  Card de “terminei” para os Stories →
                </Link>
              )}
            </>
          )}
          <Diary marks={detail.diary.marks} />
          <div className="mt-1 border-t border-border pt-3">
            <EditionPages
              entryId={entry.id}
              pageCount={entry.pageCount}
              bookPages={book.pageCount}
            />
          </div>
        </section>
      )}

      {entry && <EntryTags entryId={entry.id} />}

      <div className="flex flex-wrap items-start gap-3">
        {(book.reviewStatus === null || book.reviewStatus === "approved") && (
          <StartGroup book={bookInput} />
        )}
      </div>

      <OpenReads openLibraryId={book.openLibraryId} />
      {book.description && <Synopsis text={book.description} />}

      <CommunityStatuses community={community} />
      <CommunityFeelings community={community} />
      <Reviews detail={detail} />
      <BookQuotes detail={detail} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <li className="rounded-full border border-border px-2.5 py-0.5">{children}</li>;
}

/** Your rating: half stars and the feelings the book left (the diary suggests them). */
function RatingRow({
  entryId,
  rating,
  feelings,
  suggested,
}: {
  entryId: string;
  rating: number | null;
  feelings: Feeling[];
  suggested: Feeling[];
}) {
  const update = useUpdateShelfEntry();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm text-text-muted">
        Sua nota
        <Stars
          rating={rating}
          onChange={(value) => {
            update.mutate({ id: entryId, rating: value }, { onError: (e) => toast.failed(e) });
            toast.saved(ratingSavedMessage(value));
          }}
          className="text-xl"
        />
      </div>
      <FeelingPicker
        value={feelings}
        suggested={suggested}
        onChange={(next) => {
          update.mutate({ id: entryId, feelings: next }, { onError: (e) => toast.failed(e) });
          toast.saved(feelingsSavedMessage(next));
        }}
      />
    </div>
  );
}

/** The pages where you said how you felt: the diary your rating's feelings come from. */
function Diary({ marks }: { marks: BookDetail["diary"]["marks"] }) {
  if (marks.length === 0) return null;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text">
        Seu diário de leitura · {marks.length} {marks.length === 1 ? "página" : "páginas"}
      </summary>
      <ol className="mt-3 flex flex-col gap-2 border-l border-border pl-4">
        {marks.map((mark) => (
          <li key={mark.at} className="flex flex-wrap items-center gap-2">
            <span className="w-14 font-mono text-xs text-text-muted">p. {mark.page}</span>
            <FeelingTags feelings={mark.feelings} />
          </li>
        ))}
      </ol>
    </details>
  );
}

/** "Como os leitores se sentiram" and the star bars, once someone rated or felt the book. */
function CommunityFeelings({ community }: { community: BookDetail["community"] }) {
  if (community.ratings === 0 && community.feelings.length === 0) return null;
  return (
    <section aria-label="Na comunidade" className="grid gap-8 @3xl/main:grid-cols-2">
      {community.feelings.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-medium italic">Como os leitores se sentiram</h2>
          <ul className="flex flex-col gap-2">
            {community.feelings.map((row) => (
              <li key={row.feeling} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0">{row.label}</span>
                <Bar percent={row.percent} />
                <span className="w-10 text-right font-mono text-xs text-text-muted">
                  {row.percent}%
                </span>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            De {community.feelingReaders}{" "}
            {community.feelingReaders === 1 ? "leitor que contou" : "leitores que contaram"}
          </p>
        </div>
      )}
      {community.ratings > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="flex items-baseline gap-3 text-2xl font-medium italic">
            Notas
            <span className="font-mono text-sm not-italic text-text-muted">
              ★ {formatRating(community.averageRating ?? 0)} · {community.ratings}{" "}
              {community.ratings === 1 ? "nota" : "notas"}
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {starShares(community.stars).map((bar) => (
              <li key={bar.star} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 font-mono text-xs text-gold">{bar.star} ★</span>
                <Bar percent={bar.percent} gold />
                <span className="w-10 text-right font-mono text-xs text-text-muted">
                  {bar.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Bar({ percent, gold = false }: { percent: number; gold?: boolean }) {
  return (
    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
      <span
        className={cn("block h-full rounded-full", gold ? "bg-gold" : "bg-accent")}
        style={{ width: `${percent}%` }}
      />
    </span>
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
        <ReviewComposer bookId={detail.book.id} shelfRating={detail.entry?.rating ?? null} />
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
                  <StaffBadge role={review.author.role} />
                  {review.rating !== null && <Stars rating={review.rating} />}
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

/**
 * A review shows your shelf's rating (one per reader and book); changing the stars here changes
 * it on the shelf too (`posts.create`).
 */
function ReviewComposer({ bookId, shelfRating }: { bookId: string; shelfRating: number | null }) {
  const create = useCreatePost();
  /** undefined: not touched, so it follows the shelf's. */
  const [rating, setRating] = useState<number | null | undefined>(undefined);
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const value = rating === undefined ? shelfRating : rating;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    create.mutate(
      { kind: "review", bookId, rating: value, body: body.trim(), hasSpoilers: spoiler },
      {
        onSuccess: () => {
          setBody("");
          setRating(undefined);
          setSpoiler(false);
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
        <Stars rating={value} onChange={setRating} className="text-lg" />
        <label className="mr-auto flex items-center gap-2 text-xs text-text-muted">
          <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
          Contém spoiler
        </label>
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
  const book = bookInputOf(detail.book);
  const [finishing, setFinishing] = useState(false);

  function choose(status: ShelfStatus) {
    if (status === current) return;
    // Finishing a book is a moment: the date, the rating, how it felt ("Terminou?").
    if (status === "read" && detail.entry) return setFinishing(true);
    const onError = (error: unknown) => toast.failed(error);
    if (detail.entry) update.mutate({ id: detail.entry.id, status }, { onError });
    else add.mutate({ book, status }, { onError });
    toast.saved(shelfMoveMessage(detail.book.title, status));
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
      {finishing && <FinishDialog detail={detail} onClose={() => setFinishing(false)} />}
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

const STATUS_COLUMNS = [
  { status: "read", label: "leram" },
  { status: "reading", label: "lendo" },
  { status: "want_to_read", label: "querem ler" },
  { status: "abandoned", label: "pararam" },
] as const;

/** "Na comunidade": how many readers read the book, are reading it, want to and stopped. */
function CommunityStatuses({ community }: { community: BookDetail["community"] }) {
  // Absent in answers cached before the counters existed (or from an older backend).
  const statuses = community.statuses as typeof community.statuses | undefined;
  if (!statuses) return null;
  const shelved = STATUS_COLUMNS.reduce((sum, { status }) => sum + statuses[status], 0);
  return (
    <section aria-labelledby="community-title" className="flex flex-col gap-3">
      <h2 id="community-title" className="text-2xl font-medium italic">
        Na comunidade
      </h2>
      {shelved === 0 ? (
        <p className="text-text-muted">Ninguém tem este livro na estante ainda.</p>
      ) : (
        <dl className="grid max-w-xl grid-cols-4 divide-x divide-edge border-y border-edge">
          {STATUS_COLUMNS.map(({ status, label }) => (
            <div key={status} className="flex flex-col-reverse items-center gap-0.5 py-3">
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="font-mono text-2xl">{statuses[status]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
