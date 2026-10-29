import { groupQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { GroupCardStudio } from "@/features/groups";

export const Route = createFileRoute("/_app/juntos_/$id/card")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    void queryClient.prefetchQuery(groupQuery(id));
  },
  component: GroupCardPage,
});

function GroupCardPage() {
  const { id } = Route.useParams();
  return (
    <Screen
      back="Grupo"
      title="Card do grupo"
      subtitle="Para os Stories, o WhatsApp ou onde quiser."
    >
      <GroupCardStudio id={id} />
    </Screen>
  );
}
