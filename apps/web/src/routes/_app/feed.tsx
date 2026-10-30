import { type FeedTab, feedQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { FeedTimeline } from "@/features/feed";

export const Route = createFileRoute("/_app/feed")({
  validateSearch: (search: Record<string, unknown>): { tab?: "comunidade" } => ({
    tab: search.tab === "comunidade" ? "comunidade" : undefined,
  }),
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(feedQuery(deps.tab ? "community" : "following"));
  },
  component: FeedPage,
});

function FeedPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const current: FeedTab = tab ? "community" : "following";

  return (
    <Screen
      title="Feed"
      subtitle="O que os leitores estão lendo, terminando e guardando para depois."
    >
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
    </Screen>
  );
}
