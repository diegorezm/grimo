import { moderationQueueQuery, useMe } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { ModerationPanel } from "@/features/moderation";

/** Moderation panel: only for readers with the admin role (`moderation:setAdmin`). */
export const Route = createFileRoute("/_app/admin")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(moderationQueueQuery());
  },
  component: AdminPage,
});

function AdminPage() {
  const me = useMe();
  if (!me.data) return <Spinner />;
  if (!me.data.isAdmin) {
    return (
      <Screen title="Página não encontrada">
        <p className="text-text-muted">Essa página não existe.</p>
      </Screen>
    );
  }
  return (
    <Screen title="Moderação" subtitle="Denúncias e livros cadastrados à mão.">
      <ModerationPanel />
    </Screen>
  );
}
