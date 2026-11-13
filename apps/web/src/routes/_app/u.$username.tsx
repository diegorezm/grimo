import {
  profileShelvesQuery,
  readerActivityQuery,
  readerQuery,
  readerShelvesQuery,
  useMe,
  useReader,
  useSetBlocked,
} from "@grimo/client";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { LockIcon } from "@/components/ui/icons";
import { ReaderSafetyMenu } from "@/features/moderation";
import { ProfileView } from "@/features/profile";
import { FollowButton, ReaderActivity, ShareProfileButton } from "@/features/readers";
import { YearStats } from "@/features/stats";

/** A reader's public page. Opens signed out too, so the link can be shared anywhere. */
export const Route = createFileRoute("/_app/u/$username")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(readerQuery(params.username));
    void queryClient.prefetchQuery(readerShelvesQuery(params.username));
    void queryClient.prefetchQuery(profileShelvesQuery(params.username));
    void queryClient.prefetchQuery(readerActivityQuery(params.username));
  },
  component: ReaderPage,
});

function ReaderPage() {
  const { username } = Route.useParams();
  const { session } = Route.useRouteContext();
  const reader = useReader(username);
  const me = useMe({ enabled: Boolean(session) });
  const setBlocked = useSetBlocked();

  if (reader.isError) {
    return (
      <Screen back="Voltar" title="Leitor não encontrado">
        <p className="text-text-muted">Não existe ninguém com o usuário @{username}.</p>
      </Screen>
    );
  }
  if (!reader.data) return <Spinner />;
  const page = reader.data;
  const { profile, isFollowing, followsYou, blockedByMe, requested, canSeeReading } = page;
  const viewerId = session?.user.id ?? null;
  // Your own page lives at /me (photo, editing, the monthly card).
  if (me.data && profile.id === me.data.id) return <Navigate to="/me" replace />;
  // Until `me` loads we can not tell whose profile this is: hide the actions instead of flashing.
  const meKnown = !session || me.data !== undefined;

  return (
    <ProfileView
      page={page}
      username={username}
      actions={
        <>
          {viewerId && meKnown && !blockedByMe && (
            <FollowButton reader={{ ...profile, isFollowing, followsYou, requested }} />
          )}
          {!viewerId && (
            <Link
              to="/login"
              search={{ redirect: `/u/${username}` }}
              className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs font-medium tracking-wider text-accent-foreground uppercase shadow-md shadow-accent/30 hover:opacity-90"
            >
              Entrar para seguir
            </Link>
          )}
          <ShareProfileButton username={profile.username} name={profile.name} />
          {viewerId && meKnown && <ReaderSafetyMenu reader={profile} blocked={blockedByMe} />}
        </>
      }
      blocked={
        blockedByMe ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-text-muted">
              Você bloqueou {profile.name}. Vocês não veem o que o outro publica.
            </p>
            <Button
              variant="secondary"
              onClick={() => setBlocked.mutate({ userId: profile.id, block: false })}
            >
              Desbloquear
            </Button>
          </div>
        ) : !canSeeReading ? (
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <LockIcon className="size-6 text-text-muted" />
            <h2 className="text-xl font-medium italic">Perfil privado</h2>
            <p className="max-w-sm text-text-muted">
              {requested
                ? `Você pediu para seguir ${profile.name}. As leituras aparecem quando o pedido for aceito.`
                : `Só quem segue ${profile.name} vê as estantes, as leituras e as resenhas.`}
            </p>
          </section>
        ) : undefined
      }
      activity={<ReaderActivity username={username} interactive={Boolean(viewerId)} />}
      year={<YearStats stats={page.stats ?? undefined} />}
    />
  );
}
