import { useMe, useShelf } from "@grimo/client";
import { finishedPerMonth, genreBreakdown } from "@grimo/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { BookRow, EditProfileDialog, ProfileHeader } from "@/features/profile";
import { GenreBreakdown, MonthlyCard, ReadingRhythm, YearStats } from "@/features/stats";
import { queryClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/me")({
  component: MePage,
});

const YEAR = new Date().getFullYear();

function MePage() {
  const me = useMe();
  const shelf = useShelf();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
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
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar perfil
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sair
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <YearStats />
          <BookRow
            title="Lendo agora"
            items={reading}
            empty="Nenhum livro aberto agora. Que tal começar um?"
          />
          <BookRow
            title="Favoritos"
            items={favorites}
            empty="Avalie os livros que terminar e os melhores aparecem aqui."
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
          className="flex flex-col items-center gap-4 rounded-xl bg-surface-muted/70 p-5 lg:sticky lg:top-6 lg:self-start"
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

      <EditProfileDialog profile={me.data} open={editing} onClose={() => setEditing(false)} />
    </Screen>
  );
}
