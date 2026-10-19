import { readerConnectionsQuery, readerQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsScreen } from "@/features/readers";

export const Route = createFileRoute("/_app/u/$username_/followers")({
  loader: ({ context: { queryClient, api }, params }) => {
    void queryClient.prefetchQuery(readerQuery(api, params.username));
    void queryClient.prefetchInfiniteQuery(
      readerConnectionsQuery(api, params.username, "followers"),
    );
  },
  component: FollowersPage,
});

function FollowersPage() {
  const { username } = Route.useParams();
  const { session } = Route.useRouteContext();
  return (
    <ConnectionsScreen username={username} kind="followers" viewerId={session?.user.id ?? null} />
  );
}
