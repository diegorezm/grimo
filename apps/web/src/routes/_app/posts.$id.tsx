import { postQuery, usePost } from "@grimo/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { PostThread } from "@/features/posts";

/** A post and its comments expanded from the side peek. */
export const Route = createFileRoute("/_app/posts/$id")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(postQuery(params.id));
  },
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const post = usePost(id);
  return (
    <Screen back="Voltar">
      <div className="mx-auto w-full max-w-3xl">
        {post.data ? (
          <PostThread
            detail={post.data}
            signedIn={Boolean(session)}
            onRemoved={() => void navigate({ to: "/" })}
          />
        ) : post.isError ? (
          <p className="py-10 text-center text-text-muted">Não encontramos esse post.</p>
        ) : (
          <Spinner />
        )}
      </div>
    </Screen>
  );
}
