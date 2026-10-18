import { type FeedItem as FeedItemData, useToggleLike } from "@grimo/client";
import { describeActivity } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BookCover } from "@/features/books";

export function FeedItem({ item }: { item: FeedItemData }) {
  const toggleLike = useToggleLike();
  const { actor, book, post } = item;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar src={actor.image} name={actor.name} />
        <p className="text-sm">
          {actor.username ? (
            <Link to="/u/$username" params={{ username: actor.username }} className="font-medium">
              {actor.name}
            </Link>
          ) : (
            <span className="font-medium">{actor.name}</span>
          )}{" "}
          <span className="text-text-muted">{describeActivity(item.kind, item.data)}</span>
        </p>
      </div>

      {book?.id && (
        <div className="flex gap-3">
          <BookCover src={book.coverUrl} title={book.title ?? ""} className="w-12" />
          <div>
            <p className="font-serif font-medium">{book.title}</p>
            <p className="text-sm text-text-muted">{book.authors?.join(", ")}</p>
          </div>
        </div>
      )}

      {post?.id && (
        <div className="flex flex-col gap-2">
          <p className="whitespace-pre-line text-sm">{post.body}</p>
          <button
            type="button"
            className="w-fit text-xs text-text-muted hover:text-primary"
            onClick={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}
          >
            {post.likedByMe ? "♥" : "♡"} {post.likeCount} · {post.commentCount} comentários
          </button>
        </div>
      )}
    </Card>
  );
}
