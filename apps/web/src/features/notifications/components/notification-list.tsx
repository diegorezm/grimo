import {
  type NotificationItem,
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotifications,
} from "@grimo/client";
import { describeNotification, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostPeekLink } from "@/features/posts";
import { FollowButton } from "@/features/readers";
import { cn } from "@/utils/cn";

/** Follows, likes, comments and mentions. Opening the page marks them read. */
export function NotificationList() {
  const list = useNotifications();
  const unread = useUnreadNotifications().data ?? 0;
  const markRead = useMarkNotificationsRead();
  const { mutate } = markRead;

  // Seen once the list is on screen; new ones arriving while it is open get marked too.
  useEffect(() => {
    if (unread > 0 && list.data) mutate();
  }, [unread, list.data, mutate]);

  if (list.isPending) return <Spinner />;
  const items = list.data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-surface-muted p-6 text-text-muted">
        Nada por aqui ainda. Quando alguém seguir você, curtir, comentar ou mencionar você com @,
        aparece aqui.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <Row item={item} />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <Button
          variant="secondary"
          onClick={list.fetchNextPage}
          disabled={list.isFetchingNextPage}
          className="self-center"
        >
          {list.isFetchingNextPage ? "Carregando…" : "Ver mais"}
        </Button>
      )}
    </div>
  );
}

function Row({ item }: { item: NotificationItem }) {
  const { actor, post, comment } = item;
  const text = describeNotification(item.kind, {
    postKind: post?.kind,
    inComment: comment !== null,
  });
  const quote = comment?.snippet ?? (item.kind === "mention" ? post?.snippet : null);

  const body = (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="text-sm">
        <strong className="font-semibold">{actor.name}</strong> {text}
        {post?.book && <span className="text-text-muted"> · {post.book.title}</span>}
        <span className="ml-2 font-mono text-[11px] text-text-muted">
          {timeAgo(new Date(item.createdAt))}
        </span>
      </span>
      {quote && <span className="line-clamp-2 text-sm text-text-muted">“{quote}”</span>}
    </span>
  );

  return (
    <div className={cn("flex items-center gap-3 px-2 py-3.5", !item.read && "bg-surface-muted/60")}>
      <Link to="/u/$username" params={{ username: actor.username }} aria-label={actor.name}>
        <Avatar src={actor.image} name={actor.name} />
      </Link>
      {post ? (
        <PostPeekLink postId={post.id} className="min-w-0 flex-1 hover:opacity-80">
          {body}
        </PostPeekLink>
      ) : (
        <Link
          to="/u/$username"
          params={{ username: actor.username }}
          className="min-w-0 flex-1 hover:opacity-80"
        >
          {body}
        </Link>
      )}
      {item.kind === "follow" && item.followingActor !== null && (
        <FollowButton
          reader={{
            id: actor.id,
            name: actor.name,
            isFollowing: item.followingActor,
            followsYou: true,
          }}
          size="sm"
        />
      )}
      {!item.read && (
        <span className="size-2 shrink-0 rounded-full bg-accent">
          <span className="sr-only">Nova</span>
        </span>
      )}
    </div>
  );
}
