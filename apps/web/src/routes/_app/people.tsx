import { readerSearchQuery, readerSuggestionsQuery, useInstance, useMe } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { Avatar } from "@/components/ui/avatar";
import { PeopleDirectory, profileUrl, ShareProfileButton } from "@/features/readers";

export const Route = createFileRoute("/_app/people")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context: { queryClient, api }, deps }) => {
    if (deps.q) void queryClient.prefetchInfiniteQuery(readerSearchQuery(api, deps.q));
    else void queryClient.prefetchInfiniteQuery(readerSuggestionsQuery(api));
  },
  component: PeoplePage,
});

function PeoplePage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: instance } = useInstance();
  const { data: me } = useMe();

  if (instance && !instance.social) {
    return (
      <Screen title="Leitores">
        <p className="text-text-muted">
          Este Grimo é pessoal: seguir outros leitores está desativado.
        </p>
      </Screen>
    );
  }

  return (
    <Screen title="Leitores" subtitle="Encontre quem lê o que você lê e acompanhe as leituras.">
      <div className="grid grid-cols-1 gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_22rem] @5xl/main:gap-8">
        <PeopleDirectory
          initialQuery={q}
          onQueryChange={(value) =>
            void navigate({ search: { q: value || undefined }, replace: true, resetScroll: false })
          }
        />

        {me?.username && (
          <aside
            aria-labelledby="share-title"
            className="flex flex-col gap-4 rounded-xl bg-surface-muted/70 p-5 @5xl/main:sticky @5xl/main:top-6 @5xl/main:self-start"
          >
            <div>
              <h2 id="share-title" className="text-xl font-medium italic">
                Chame seus amigos
              </h2>
              <p className="text-sm text-text-muted">
                Seu perfil abre para qualquer pessoa, mesmo sem conta.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
              <Avatar src={me.image} name={me.name} />
              <div className="min-w-0">
                <p className="truncate font-medium">{me.name}</p>
                <p className="truncate font-mono text-[11px] text-text-muted">
                  {profileUrl(me.username).replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
            <ShareProfileButton username={me.username} name={me.name} own className="self-start" />
          </aside>
        )}
      </div>
    </Screen>
  );
}
