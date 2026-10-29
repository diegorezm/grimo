import {
  errorMessage,
  type PostDetail,
  useAddComment,
  useMe,
  useRemoveComment,
  useRemovePost,
  useToggleLike,
} from "@grimo/client";
import { commentCountLabel, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MentionText } from "@/components/ui/mention-text";
import { StaffBadge } from "@/components/ui/staff-badge";
import { Stars } from "@/components/ui/stars";
import { BookCover, BookPeekLink } from "@/features/books";
import { ReportButton } from "@/features/moderation";

/** A post with its comments, a box to comment and, when it is yours, a way to delete it. */
export function PostThread({
  detail,
  signedIn,
  onRemoved,
}: {
  detail: PostDetail;
  signedIn: boolean;
  /** After deleting the post: close the peek or leave the page. */
  onRemoved: () => void;
}) {
  const { post, comments } = detail;
  const me = useMe({ enabled: signedIn });
  const toggleLike = useToggleLike();
  const removePost = useRemovePost();
  const isMine = me.data?.id === post.author.id;

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <Avatar src={post.author.image} name={post.author.name} size="size-9" />
          <p className="text-sm">
            <AuthorLink author={post.author} />
            <span className="ml-2 font-mono text-[10px] text-text-muted">
              {timeAgo(new Date(post.createdAt))}
            </span>
          </p>
        </header>

        {post.book && (
          <BookPeekLink
            openLibraryId={post.book.openLibraryId}
            className="group flex w-fit items-center gap-3"
          >
            <BookCover src={post.book.coverUrl} title={post.book.title} className="w-10" />
            <span className="font-serif font-medium italic leading-snug group-hover:underline">
              {post.book.title}
            </span>
          </BookPeekLink>
        )}
        {post.rating && <Stars rating={post.rating} />}
        <MentionText text={post.body} className="leading-relaxed" />

        <div className="flex items-center gap-4 font-mono text-[11px] text-text-muted">
          {signedIn ? (
            <button
              type="button"
              aria-pressed={post.likedByMe}
              onClick={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
              className="hover:text-accent"
            >
              {post.likedByMe ? "♥" : "♡"} {post.likeCount}
            </button>
          ) : (
            <span>♡ {post.likeCount}</span>
          )}
          <span>{commentCountLabel(post.commentCount)}</span>
          {isMine ? (
            <span className="ml-auto">
              <ConfirmButton
                label="Apagar post"
                warning="Apaga também curtidas e comentários."
                pending={removePost.isPending}
                onConfirm={() => removePost.mutate(post.id, { onSuccess: onRemoved })}
              />
            </span>
          ) : (
            signedIn && <ReportButton target="post" targetId={post.id} className="ml-auto" />
          )}
        </div>
      </div>

      <section aria-labelledby="comments" className="flex flex-col gap-5">
        <h2 id="comments" className="text-2xl font-medium italic">
          Comentários
        </h2>
        {signedIn ? (
          <CommentComposer postId={post.id} />
        ) : (
          <p className="text-sm text-text-muted">Entre para comentar.</p>
        )}
        {comments.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum comentário ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {comments.map((comment) => {
              const mine = me.data?.id === comment.author.id;
              return (
                <Comment
                  key={comment.id}
                  postId={post.id}
                  comment={comment}
                  // Your own comments, and any comment on your own post.
                  canRemove={mine || isMine}
                  canReport={me.data !== undefined && !mine}
                />
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}

function AuthorLink({
  author,
}: {
  author: { name: string | null; username: string | null; role?: "admin" | "moderator" | null };
}) {
  return (
    <>
      {author.username ? (
        <Link
          to="/u/$username"
          params={{ username: author.username }}
          className="font-semibold hover:underline"
        >
          {author.name}
        </Link>
      ) : (
        <span className="font-semibold">{author.name}</span>
      )}
      <StaffBadge role={author.role} />
    </>
  );
}

function Comment({
  postId,
  comment,
  canRemove,
  canReport,
}: {
  postId: string;
  comment: PostDetail["comments"][number];
  canRemove: boolean;
  canReport: boolean;
}) {
  const remove = useRemoveComment(postId);
  return (
    <li className="flex gap-3 py-4 first:pt-0">
      <Avatar src={comment.author.image} name={comment.author.name} size="size-8" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <AuthorLink author={comment.author} />
          <span className="font-mono text-[10px] text-text-muted">
            {timeAgo(new Date(comment.createdAt))}
          </span>
        </p>
        <MentionText text={comment.body} className="text-sm leading-relaxed" />
        {(canRemove || canReport) && (
          <div className="flex items-center gap-4 font-mono text-[11px] text-text-muted">
            {canRemove && (
              <ConfirmButton
                label="Apagar"
                pending={remove.isPending}
                onConfirm={() => remove.mutate(comment.id)}
              />
            )}
            {canReport && <ReportButton target="comment" targetId={comment.id} />}
          </div>
        )}
      </div>
    </li>
  );
}

function CommentComposer({ postId }: { postId: string }) {
  const add = useAddComment(postId);
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    add.mutate(body.trim(), { onSuccess: () => setBody("") });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Escreva um comentário (@ para mencionar)"
        aria-label="Seu comentário"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
      {add.error && <p className="text-sm text-danger">{errorMessage(add.error)}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={!body.trim() || add.isPending}>
          Comentar
        </Button>
      </div>
    </form>
  );
}

/** A destructive action behind a second click. */
function ConfirmButton({
  label,
  warning,
  pending,
  onConfirm,
}: {
  label: string;
  warning?: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="hover:text-text">
        {label}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3">
      {warning && <span>{warning}</span>}
      <button type="button" disabled={pending} onClick={onConfirm} className="text-danger">
        {label}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="hover:text-text">
        Cancelar
      </button>
    </span>
  );
}
