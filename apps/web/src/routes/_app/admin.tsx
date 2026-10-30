import { moderationCountsQuery, useMe } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/feedback/spinner";
import { Screen } from "@/components/layout/screen";
import { ModerationPanel } from "@/features/moderation";

/** Moderation panel: for the moderation team (admins and moderators). */
export const Route = createFileRoute("/_app/admin")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(moderationCountsQuery());
  },
  component: AdminPage,
});

function AdminPage() {
  const me = useMe();
  if (!me.data) return <Spinner />;
  if (!me.data.isStaff) {
    return (
      <Screen title="Página não encontrada">
        <p className="text-text-muted">Essa página não existe.</p>
      </Screen>
    );
  }
  return (
    <Screen title="Moderação" subtitle="Denúncias, livros cadastrados à mão e a equipe.">
      <ModerationPanel />
    </Screen>
  );
}
