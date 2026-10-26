import {
  meQuery,
  monthlySummaryQuery,
  shelfQuery,
  useMe,
  useShelf,
  yearOverviewQuery,
} from "@grimo/client";
import { finishedPerMonth, genreBreakdown } from "@grimo/core";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { LogOutIcon, PencilIcon } from "@/components/ui/icons";
import { BookRow, ProfileHeader } from "@/features/profile";
import { ShareProfileButton } from "@/features/readers";
import { GenreBreakdown, MonthlyCard, ReadingRhythm, YearStats } from "@/features/stats";
import { clearCacheForSignOut } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/me")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(meQuery());
    void queryClient.prefetchQuery(shelfQuery());
    void queryClient.prefetchQuery(yearOverviewQuery());
    void queryClient.prefetchQuery(monthlySummaryQuery());
  },
  component: MePage,
});

const YEAR = new Date().getFullYear();

function MePage() {
  const me = useMe();
  const shelf = useShelf();
  const navigate = useNavigate();

  async function signOut() {
    await clearCacheForSignOut();
    await authClient.signOut();
    await navigate({ to: "/login" });
  }

  if (!me.data || !shelf.data) return <Spinner />;
  const items = shelf.data.items;
  const read = items.filter(({ entry }) => entry.status === "read");
  const reading = items.filter(({ entry }) => entry.status === "reading");
  const favorites = [...read]
    .filter(({ entry }) => entry.rating)
    .sort((a, b) => (b.entry.rating ?? 0) - (a.entry.rating ?? 0))
    .slice(0, 10);
  const covers = [...reading, ...read].flatMap(({ book }) =>
    book.coverUrl ? [book.coverUrl] : [],
  );

  return (
    <Screen>
      <ProfileHeader
        profile={me.data}
        covers={covers}
        bookCount={items.length}
        linkCounts
        actions={
          <>
            {me.data.username && (
              <ShareProfileButton username={me.data.username} name={me.data.name} own />
            )}
            <Link
              to="."
              search={(prev) => ({ ...prev, panel: "profile" as const })}
              resetScroll={false}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-2.5 pr-5 pl-4 font-mono text-xs font-medium uppercase tracking-wider shadow-sm shadow-shadow transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-md"
            >
              <PencilIcon className="size-4" />
              Editar perfil
            </Link>
            <Link
              to="/settings/account"
              className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider shadow-sm shadow-shadow transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-md"
            >
              Conta e privacidade
            </Link>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair da conta"
              title="Sair da conta"
              className="grid size-10 place-items-center rounded-full border border-border bg-surface text-text-muted shadow-sm shadow-shadow transition hover:-translate-y-0.5 hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
            >
              <LogOutIcon className="size-[18px]" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_22rem] @5xl/main:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <YearStats />
          <BookRow
            title="Lendo agora"
            items={reading}
            empty="Nenhum livro aberto agora. Que tal começar um?"
            shelfLink
          />
          <BookRow
            title="Favoritos"
            items={favorites}
            empty="Avalie os livros que terminar e os melhores aparecem aqui."
            shelfLink
          />
          <div className="grid grid-cols-1 gap-6 @4xl/main:grid-cols-2">
            <ReadingRhythm
              counts={finishedPerMonth(
                items.map(({ entry }) => entry),
                YEAR,
              )}
              year={YEAR}
            />
            <GenreBreakdown genres={genreBreakdown(read.map(({ book }) => book))} />
          </div>
        </div>

        <aside
          aria-labelledby="monthly-title"
          className="flex flex-col items-center gap-4 rounded-xl bg-surface-muted/70 p-5 @5xl/main:sticky @5xl/main:top-6 @5xl/main:self-start"
        >
          <div className="w-full">
            <h2 id="monthly-title" className="text-xl font-medium italic">
              Card do mês
            </h2>
            <p className="text-sm text-text-muted">Seu mês pronto para os Stories.</p>
          </div>
          <MonthlyCard />
        </aside>
      </div>
    </Screen>
  );
}
