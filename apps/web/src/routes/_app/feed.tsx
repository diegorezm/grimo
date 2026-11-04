import { type FeedTab, feedQuery, readerSuggestionsQuery } from "@grimo/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { FeedTimeline } from "@/features/feed";
import { ReaderSuggestions } from "@/features/readers";

export const Route = createFileRoute("/_app/feed")({
  validateSearch: (search: Record<string, unknown>): { tab?: "comunidade" } => ({
    tab: search.tab === "comunidade" ? "comunidade" : undefined,
  }),
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(feedQuery(deps.tab ? "community" : "following"));
    void queryClient.prefetchQuery(readerSuggestionsQuery());
  },
  component: FeedPage,
});

/** Readers in the side column; the full list is on /people. */
const SUGGESTIONS = 3;

function FeedPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const current: FeedTab = tab ? "community" : "following";

  return (
    <Screen
      title="Feed"
      subtitle="O que os leitores estão lendo, terminando e guardando para depois."
    >
      <div className="grid grid-cols-1 gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_22rem] @5xl/main:gap-8">
        <FeedTimeline
          tab={current}
          onTabChange={(next) =>
            void navigate({
              search: (prev) => ({ ...prev, tab: next === "community" ? "comunidade" : undefined }),
              replace: true,
              resetScroll: false,
            })
          }
        />
        <aside
          aria-labelledby="follow-title"
          className="flex flex-col gap-4 rounded-xl bg-surface-muted/70 p-5 @5xl/main:sticky @5xl/main:top-6 @5xl/main:self-start"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="follow-title" className="text-xl font-medium italic">
              Quem seguir
            </h2>
            <Link
              to="/people"
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:opacity-80"
            >
              Ver todos →
            </Link>
          </div>
          <ReaderSuggestions limit={SUGGESTIONS} />
        </aside>
      </div>
    </Screen>
  );
}
