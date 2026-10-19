import { readerConnectionsQuery, readerQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsScreen } from "@/features/readers";

export const Route = createFileRoute("/_app/u/$username_/following")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(readerQuery(params.username));
    void queryClient.prefetchQuery(readerConnectionsQuery(params.username, "following"));
  },
  component: FollowingPage,
});

function FollowingPage() {
  const { username } = Route.useParams();
  const { session } = Route.useRouteContext();
  return (
    <ConnectionsScreen username={username} kind="following" viewerId={session?.user.id ?? null} />
  );
}
