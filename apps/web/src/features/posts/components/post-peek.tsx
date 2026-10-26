import { usePost } from "@grimo/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { ExpandIcon, SidePeek } from "@/components/layout/side-peek";
import { PostThread } from "./post-thread";

/** A post and its comments as a side peek (opened with `?post=<id>` on any screen). */
export function PostPeek({ postId }: { postId: string }) {
  const navigate = useNavigate();
  const post = usePost(postId);
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, post: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );

  return (
    <SidePeek
      label="Post"
      onClose={close}
      expand={
        <Link
          to="/posts/$id"
          params={{ id: postId }}
          aria-label="Abrir como página"
          title="Abrir como página"
          className="grid size-9 place-items-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          <ExpandIcon />
        </Link>
      }
    >
      {post.data ? (
        <PostThread detail={post.data} signedIn onRemoved={close} />
      ) : post.isError ? (
        <p className="py-10 text-center text-text-muted">Não encontramos esse post.</p>
      ) : (
        <Spinner />
      )}
    </SidePeek>
  );
}
