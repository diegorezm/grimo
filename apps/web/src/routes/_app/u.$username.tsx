import { readerActivityQuery, readerQuery, useReader } from "@grimo/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { BookRow, ProfileHeader } from "@/features/profile";
import { FollowButton, ReaderActivity, ShareProfileButton } from "@/features/readers";
import { YearStats } from "@/features/stats";

/** A reader's public page. Opens signed out too, so the link can be shared anywhere. */
export const Route = createFileRoute("/_app/u/$username")({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(readerQuery(params.username));
    void queryClient.prefetchQuery(readerActivityQuery(params.username));
  },
  component: ReaderPage,
});

function ReaderPage() {
  const { username } = Route.useParams();
  const { session } = Route.useRouteContext();
  const reader = useReader(username);

  if (reader.isError) {
    return (
      <Screen back="Voltar" title="Leitor não encontrado">
        <p className="text-text-muted">Não existe ninguém com o usuário @{username}.</p>
      </Screen>
    );
  }
  if (!reader.data) return <Spinner />;
  const { profile, stats, books, isFollowing, followsYou } = reader.data;
  const viewerId = session?.user.id ?? null;
  const isMe = profile.id === viewerId;

  return (
    <Screen>
      <ProfileHeader
        profile={profile}
        covers={books.covers}
        bookCount={books.total}
        followsYou={followsYou}
        linkCounts
        actions={
          <>
            {viewerId && !isMe && <FollowButton reader={{ ...profile, isFollowing, followsYou }} />}
            {!viewerId && (
              <Link
                to="/login"
                search={{ redirect: `/u/${username}` }}
                className="bg-accent-gradient rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
              >
                Entrar para seguir
              </Link>
            )}
            {isMe && (
              <Link
                to="/me"
                className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider shadow-sm shadow-shadow transition hover:border-accent/50 hover:text-accent"
              >
                Meu painel
              </Link>
            )}
            {profile.username && (
              <ShareProfileButton username={profile.username} name={profile.name} own={isMe} />
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_24rem] @5xl/main:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <YearStats stats={stats} />
          <BookRow
            title="Lendo agora"
            items={books.reading}
            empty={`${profile.name} não tem nenhum livro aberto agora.`}
          />
          <BookRow
            title="Favoritos"
            items={books.favorites}
            empty="Os livros mais bem avaliados aparecem aqui."
          />
        </div>

        {/* Fixed height, scrolling inside: a long history never stretches the page. */}
        <section
          aria-labelledby="activity-title"
          className="flex max-h-[36rem] min-h-0 flex-col rounded-xl bg-surface-muted/70 @5xl/main:sticky @5xl/main:top-6 @5xl/main:max-h-[calc(100dvh-3rem)] @5xl/main:self-start"
        >
          <h2 id="activity-title" className="px-5 pt-5 pb-2 text-xl font-medium italic">
            Atividade
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 [scrollbar-width:thin]">
            <ReaderActivity username={username} interactive={Boolean(viewerId)} />
          </div>
        </section>
      </div>
    </Screen>
  );
}
