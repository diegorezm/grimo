import {
  type FeedItem as FeedItemData,
  useMe,
  useShelveFromFeed,
  useToggleUpdateLike,
  useUpdateThread,
} from "@grimo/client";
import {
  activityProgress,
  commentCountLabel,
  feedHeadline,
  SHELF_LABELS,
  type ShelfStatus,
  timeAgo,
} from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { MentionText } from "@/components/ui/mention-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StaffBadge } from "@/components/ui/staff-badge";
import { Stars } from "@/components/ui/stars";
import { BookCover, BookPeekLink } from "@/features/books";
import { ReportButton } from "@/features/moderation";
import { PostPeekLink } from "@/features/posts";
import { cn } from "@/utils/cn";

/** Covers shown for a grouped entry before "+N". */
const MAX_COVERS = 8;

/** Updates readers can like and comment on (follows can't). */
const REACTABLE = new Set<FeedItemData["kind"]>(["shelved", "progress", "finished", "posted"]);

/**
 * One activity as a card (the feed, a reader's page): who did what, the book with a big cover,
 * and what it means for the book (progress bar, stars, shelf). `more` are older activities
 * grouped into this one (see `groupActivities`): books added to the same shelf or finished
 * show as a row of covers. `interactive` turns on likes and "Quero ler"; off for visitors who
 * are signed out.
 */
export function FeedItem({
  item,
  more = [],
  interactive = true,
}: {
  item: FeedItemData;
  more?: FeedItemData[];
  interactive?: boolean;
}) {
  const me = useMe({ enabled: interactive });
  const { actor, book, post, target, reading } = item;
  const mine = me.data?.id === actor.id;
  // Progress groups show only the latest page; shelf and finished groups list every book.
  const books =
    more.length > 0 && item.kind !== "progress"
      ? [item, ...more].flatMap(({ book }) =>
          book?.title && book.openLibraryId
            ? [{ ...book, title: book.title, openLibraryId: book.openLibraryId }]
            : [],
        )
      : [];

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm shadow-shadow @xl/main:p-5">
      <header className="flex items-center gap-3">
        <Avatar src={actor.image} name={actor.name} size="size-9" />
        <p className="min-w-0 flex-1 text-sm leading-snug">
          <ReaderLink reader={actor} className="font-semibold" />
          <StaffBadge role={actor.role} className="ml-1.5" />{" "}
          <span className="text-text-muted">
            {feedHeadline(item.kind, item.data, books.length || 1)}
          </span>
          {target?.name && (
            <>
              {" "}
              <ReaderLink reader={target} className="font-semibold" />
            </>
          )}
        </p>
        <time
          dateTime={new Date(item.createdAt).toISOString()}
          className="shrink-0 font-mono text-[10px] text-text-muted"
        >
          {timeAgo(new Date(item.createdAt))}
        </time>
      </header>

      {books.length > 0 ? (
        <ul className="flex flex-wrap gap-2.5" aria-label="Livros">
          {books.slice(0, MAX_COVERS).map((b) => (
            <li key={b.openLibraryId}>
              <BookPeekLink openLibraryId={b.openLibraryId} className="block">
                <span title={b.title}>
                  <BookCover
                    src={b.coverUrl}
                    title={b.title}
                    className="w-14 shadow-sm shadow-shadow transition hover:-translate-y-0.5"
                  />
                </span>
              </BookPeekLink>
            </li>
          ))}
          {books.length > MAX_COVERS && (
            <li className="grid aspect-[2/3] w-14 place-items-center rounded-sm bg-surface-muted font-mono text-[11px] text-text-muted">
              +{books.length - MAX_COVERS}
            </li>
          )}
        </ul>
      ) : (
        book?.title &&
        book.openLibraryId && (
          <div className="flex gap-4">
            <BookPeekLink openLibraryId={book.openLibraryId} className="shrink-0">
              <BookCover
                src={book.coverUrl}
                title={book.title}
                className="w-20 shadow-md shadow-shadow transition hover:-translate-y-0.5"
              />
            </BookPeekLink>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <BookPeekLink
                openLibraryId={book.openLibraryId}
                className="font-serif text-lg font-medium italic leading-snug hover:underline"
              >
                {book.title}
              </BookPeekLink>
              <p className="truncate text-sm text-text-muted">{book.authors?.join(", ")}</p>
              <BookDetail item={item} />
              {interactive && !mine && reading && (
                <ShelfAction
                  book={{ ...book, title: book.title, openLibraryId: book.openLibraryId }}
                  status={reading.viewerStatus}
                />
              )}
            </div>
          </div>
        )
      )}

      {post?.body && <PostBody body={post.body} hasSpoilers={post.hasSpoilers} />}
      {REACTABLE.has(item.kind) && (
        <Reactions item={item} interactive={interactive} canReport={Boolean(me.data && !mine)} />
      )}
    </article>
  );
}

/** A review, note or comment on an update; spoilers stay hidden until asked. */
function PostBody({ body, hasSpoilers }: { body: string; hasSpoilers: boolean }) {
  const [shown, setShown] = useState(!hasSpoilers);
  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => setShown(true)}
        className="w-fit rounded-md bg-surface-muted px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
      >
        Contém spoiler · mostrar
      </button>
    );
  }
  return <MentionText text={body} className="text-sm leading-relaxed" />;
}

/**
 * Like and comment on any update, like Skoob: an update nobody reacted to yet gets its thread
 * on the first like or comment.
 */
function Reactions({
  item,
  interactive,
  canReport,
}: {
  item: FeedItemData;
  interactive: boolean;
  canReport: boolean;
}) {
  const toggleLike = useToggleUpdateLike();
  const thread = useUpdateThread();
  const navigate = useNavigate();
  const { post } = item;
  const liked = Boolean(post?.likedByMe);
  const likes = post?.likeCount ?? 0;
  const comments = commentCountLabel(post?.commentCount ?? 0);
  const openThread = (postId: string) =>
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, post: postId, book: undefined, panel: undefined }),
      resetScroll: false,
    });

  return (
    <div className="flex items-center gap-4 border-t border-border pt-3 font-mono text-[11px] text-text-muted">
      {interactive ? (
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Descurtir" : "Curtir"}
          onClick={() => toggleLike.mutate({ activityId: item.id, like: !liked })}
          className={cn("hover:text-accent", liked && "text-accent")}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
      ) : (
        <span>♡ {likes}</span>
      )}
      {!interactive ? (
        <span>{comments}</span>
      ) : post?.id ? (
        <PostPeekLink postId={post.id} className="hover:text-text">
          {comments}
        </PostPeekLink>
      ) : (
        <button
          type="button"
          disabled={thread.isPending}
          onClick={() =>
            thread.mutate(item.id, { onSuccess: ({ post: created }) => openThread(created.id) })
          }
          className="hover:text-text"
        >
          Comentar
        </button>
      )}
      {interactive && canReport && post?.id && post.body && (
        <ReportButton target="post" targetId={post.id} className="ml-auto" />
      )}
    </div>
  );
}

/** Under the title: the progress bar, the stars or the shelf, depending on what happened. */
function BookDetail({ item }: { item: FeedItemData }) {
  const { kind, data, reading, post } = item;
  if (kind === "progress") {
    const progress = activityProgress(data, reading?.pages ?? null);
    if (!progress) return null;
    return (
      <div className="mt-1 flex max-w-xs flex-col gap-1">
        {progress.percent !== null && <ProgressBar percent={progress.percent} />}
        <span className="font-mono text-[11px] text-text-muted">{progress.label}</span>
      </div>
    );
  }
  const rating = post?.rating ?? reading?.rating ?? null;
  if (rating) return <Stars rating={rating} />;
  const status = data?.status as ShelfStatus | undefined;
  if (kind === "shelved" && status) {
    return (
      <span className="w-fit rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {SHELF_LABELS[status]}
      </span>
    );
  }
  return null;
}

/** "Quero ler" for a book you don't have yet, or where it already is on your shelves. */
function ShelfAction({
  book,
  status,
}: {
  book: NonNullable<FeedItemData["book"]> & { title: string; openLibraryId: string };
  status: ShelfStatus | null;
}) {
  const shelve = useShelveFromFeed();
  if (status) {
    return (
      <p className="mt-auto pt-1 font-mono text-[10px] uppercase tracking-wider text-accent">
        ✓ Na sua estante · {SHELF_LABELS[status]}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() => shelve.mutate({ book, status: "want_to_read" })}
      disabled={shelve.isPending}
      className="mt-auto w-fit rounded-full border border-edge px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition hover:border-accent hover:text-accent disabled:opacity-50"
    >
      + Quero ler
    </button>
  );
}

function ReaderLink({
  reader,
  className,
}: {
  reader: { name: string | null; username: string | null };
  className?: string;
}) {
  return reader.username ? (
    <Link
      to="/u/$username"
      params={{ username: reader.username }}
      className={cn(className, "hover:underline")}
    >
      {reader.name}
    </Link>
  ) : (
    <span className={className}>{reader.name}</span>
  );
}
