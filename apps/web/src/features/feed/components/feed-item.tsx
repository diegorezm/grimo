import { type FeedItem as FeedItemData, useMe, useToggleLike } from "@grimo/client";
import { describeActivityGroup, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/avatar";
import { BookCover, BookPeekLink } from "@/features/books";
import { ReportButton } from "@/features/moderation";
import { cn } from "@/utils/cn";

/** Covers shown for a grouped entry before "+N". */
const MAX_COVERS = 8;

/**
 * One activity as a full-width entry (a reader's page, the full feed). `more` are older
 * activities grouped into this one (see `groupActivities`): books added to the same shelf or
 * finished show as a row of covers. `interactive` turns the like into a button; off for
 * visitors who are signed out.
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
  const toggleLike = useToggleLike();
  const me = useMe({ enabled: interactive });
  const { actor, book, post, target } = item;
  const hasBook = Boolean(book?.title && book.openLibraryId);
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
    <article className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <Avatar src={actor.image} name={actor.name} size="size-8" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <p className="text-sm leading-snug">
          <ReaderLink reader={actor} className="font-semibold" />{" "}
          <span className="text-text-muted">
            {describeActivityGroup(item.kind, item.data, books.length || 1)}
          </span>
          {target?.name && (
            <>
              {" "}
              <ReaderLink reader={target} className="font-semibold" />
            </>
          )}
          <span className="ml-2 font-mono text-[10px] text-text-muted">
            {timeAgo(new Date(item.createdAt))}
          </span>
        </p>

        {books.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Livros">
            {books.slice(0, MAX_COVERS).map((b) => (
              <li key={b.openLibraryId}>
                <BookPeekLink openLibraryId={b.openLibraryId} className="block">
                  <span title={b.title}>
                    <BookCover
                      src={b.coverUrl}
                      title={b.title}
                      className="w-10 shadow-sm shadow-shadow transition hover:-translate-y-0.5"
                    />
                  </span>
                </BookPeekLink>
              </li>
            ))}
            {books.length > MAX_COVERS && (
              <li className="grid aspect-[2/3] w-10 place-items-center rounded-sm bg-surface-muted font-mono text-[10px] text-text-muted">
                +{books.length - MAX_COVERS}
              </li>
            )}
          </ul>
        ) : (
          hasBook && (
            <BookPeekLink
              openLibraryId={book!.openLibraryId!}
              className="group flex w-fit items-center gap-3"
            >
              <BookCover src={book!.coverUrl} title={book!.title!} className="w-10" />
              <span>
                <span className="block font-serif font-medium italic leading-snug group-hover:underline">
                  {book!.title}
                </span>
                <span className="block text-sm text-text-muted">{book!.authors?.join(", ")}</span>
              </span>
            </BookPeekLink>
          )
        )}

        {post?.id && (
          <>
            <p className="whitespace-pre-line text-sm leading-relaxed">{post.body}</p>
            <div className="flex items-center gap-4 font-mono text-[11px] text-text-muted">
              {interactive ? (
                <button
                  type="button"
                  aria-pressed={Boolean(post.likedByMe)}
                  onClick={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}
                  className="hover:text-accent"
                >
                  {post.likedByMe ? "♥" : "♡"} {post.likeCount}
                </button>
              ) : (
                <span>♡ {post.likeCount}</span>
              )}
              <span>{post.commentCount} comentários</span>
              {interactive && me.data && me.data.id !== actor.id && (
                <ReportButton target="post" targetId={post.id} className="ml-auto" />
              )}
            </div>
          </>
        )}
      </div>
    </article>
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
