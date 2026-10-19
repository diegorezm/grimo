import { readerQuery, useInstance, useReader, useToggleFollow } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile";
import { YearStats } from "@/features/stats";

export const Route = createFileRoute("/_app/u/$username")({
  loader: ({ context: { queryClient, api }, params }) => {
    void queryClient.prefetchQuery(readerQuery(api, params.username));
  },
  component: ReaderPage,
});

function ReaderPage() {
  const { username } = Route.useParams();
  const { session } = Route.useRouteContext();
  const reader = useReader(username);
  const toggleFollow = useToggleFollow(username);
  const social = useInstance().data?.social ?? false;

  if (!reader.data) return <Spinner />;
  const { profile, stats, isFollowing } = reader.data;

  return (
    <Screen>
      <div className="flex flex-col gap-8">
        <ProfileHeader
          profile={profile}
          actions={
            social &&
            profile.id !== session.user.id && (
              <Button
                variant={isFollowing ? "secondary" : "primary"}
                onClick={() => toggleFollow.mutate({ userId: profile.id, follow: !isFollowing })}
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            )
          }
        />
        <YearStats stats={stats} />
      </div>
    </Screen>
  );
}
