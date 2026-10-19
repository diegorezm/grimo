import {
  type FeedItem,
  useCreatePost,
  useFeed,
  useInstance,
  useMe,
  useToggleLike,
} from "@grimo/client";
import { describeActivity, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { LoadMore } from "@/components/ui/load-more";
import { BookCover, BookPeekLink } from "@/features/books";
import { cn } from "@/utils/cn";

/**
 * Compact feed for the dashboard's side column: posts read like a conversation (your own on
 * the right), other activity as one-line updates, and a note composer at the bottom.
 */
export function FeedPanel({ className }: { className?: string }) {
  const feed = useFeed();
  const { data: me } = useMe();
  const social = useInstance().data?.social ?? true;
  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <aside
      aria-labelledby="feed-panel-title"
      className={cn("flex min-h-0 flex-col rounded-xl bg-surface-muted/70", className)}
    >
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 id="feed-panel-title" className="text-xl font-medium italic">
          {social ? "Atividade" : "Seu diário"}
        </h2>
        {social ? (
          <Link
            to="/people"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted hover:text-accent"
          >
            Encontrar leitores →
          </Link>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Só você
          </span>
        )}
      </header>

      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {feed.isPending && <Spinner />}
        {!feed.isPending && items.length === 0 && (
          <li className="flex flex-col items-center gap-3 py-10 text-center text-sm text-text-muted">
            Nada por aqui ainda. Que tal escrever uma nota?
            {social && (
              <Link
                to="/people"
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
              >
                Encontrar leitores →
              </Link>
            )}
          </li>
        )}
        {items.map((item) =>
          item.post?.id ? (
            <PostBubble key={item.id} item={item} mine={item.actor.username === me?.username} />
          ) : (
            <ActivityLine key={item.id} item={item} />
          ),
        )}
        {feed.hasNextPage && (
          <li>
            <LoadMore {...feed} className="py-2" />
          </li>
        )}
      </ol>

      <NoteComposer />
    </aside>
  );
}

function ActorName({ actor }: { actor: { name: string | null; username: string | null } }) {
  return actor.username ? (
    <Link to="/u/$username" params={{ username: actor.username }} className="font-semibold">
      {actor.name}
    </Link>
  ) : (
    <span className="font-semibold">{actor.name}</span>
  );
}

function ActivityLine({ item }: { item: FeedItem }) {
  const { actor, book } = item;
  return (
    <li className="flex items-center gap-2.5 px-1 text-sm">
      <Avatar src={actor.image} name={actor.name} size="size-7" />
      <p className="min-w-0 flex-1 leading-snug">
        <ActorName actor={actor} />{" "}
        <span className="text-text-muted">{describeActivity(item.kind, item.data)}</span>
        {item.target?.name && (
          <>
            {" "}
            <ActorName actor={item.target} />
          </>
        )}
        {book?.title && book.openLibraryId && (
          <>
            {" "}
            <BookPeekLink
              openLibraryId={book.openLibraryId}
              className="font-serif italic hover:underline"
            >
              {book.title}
            </BookPeekLink>
          </>
        )}
        <span className="ml-1.5 font-mono text-[10px] text-text-muted">
          {timeAgo(new Date(item.createdAt))}
        </span>
      </p>
      {book?.title && book.openLibraryId && (
        <BookPeekLink openLibraryId={book.openLibraryId}>
          <BookCover src={book.coverUrl} title={book.title} className="w-6" />
        </BookPeekLink>
      )}
    </li>
  );
}

function PostBubble({ item, mine }: { item: FeedItem; mine: boolean }) {
  const toggleLike = useToggleLike();
  const { actor, book, post } = item;
  if (!post?.id) return null;

  return (
    <li className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      <Avatar src={actor.image} name={actor.name} size="size-8" />
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-lg px-4 py-3 text-sm shadow-sm shadow-shadow",
          mine
            ? "bg-accent-gradient rounded-br-sm text-accent-foreground"
            : "rounded-bl-sm bg-surface",
        )}
      >
        {!mine && (
          <p className="text-xs">
            <ActorName actor={actor} />
          </p>
        )}
        {book?.title && book.openLibraryId && (
          <BookPeekLink
            openLibraryId={book.openLibraryId}
            className="flex items-center gap-2.5 hover:underline"
          >
            <BookCover src={book.coverUrl} title={book.title} className="w-8" />
            <span className="font-serif text-sm font-medium italic leading-snug">{book.title}</span>
          </BookPeekLink>
        )}
        <p className="whitespace-pre-line leading-relaxed">{post.body}</p>
        <div
          className={cn(
            "flex items-center gap-3 font-mono text-[10px]",
            mine ? "text-accent-foreground/80" : "text-text-muted",
          )}
        >
          <button
            type="button"
            aria-pressed={Boolean(post.likedByMe)}
            onClick={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}
            className="hover:opacity-80"
          >
            {post.likedByMe ? "♥" : "♡"} {post.likeCount}
          </button>
          <span>{post.commentCount} comentários</span>
          <span className="ml-auto">{timeAgo(new Date(item.createdAt))}</span>
        </div>
      </div>
    </li>
  );
}

function NoteComposer() {
  const create = useCreatePost();
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    create.mutate(
      { kind: "note", body: text, bookId: null, rating: null, hasSpoilers: false },
      { onSuccess: () => setBody("") },
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escreva uma nota…"
        aria-label="Escreva uma nota"
        className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="submit"
        disabled={!body.trim() || create.isPending}
        aria-label="Publicar nota"
        className="bg-accent-gradient grid size-10 shrink-0 place-items-center rounded-full text-accent-foreground shadow-md shadow-accent/30 transition hover:opacity-90 disabled:opacity-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
          <path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z" />
        </svg>
      </button>
    </form>
  );
}
