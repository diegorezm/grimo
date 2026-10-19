import { useInstance, useReader, useToggleFollow } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile";

export const Route = createFileRoute("/_app/u/$username")({
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
      <div className="flex flex-col gap-6">
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
        <p className="text-sm text-text-muted">
          {stats.booksRead} livros e {stats.pagesRead} páginas lidas em {stats.year}.
        </p>
      </div>
    </Screen>
  );
}
