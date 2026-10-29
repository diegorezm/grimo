import { groupMessagesQuery, groupQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { GroupView } from "@/features/groups";

export const Route = createFileRoute("/_app/juntos/$id")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    void queryClient.prefetchQuery(groupQuery(id));
    void queryClient.prefetchQuery(groupMessagesQuery(id));
  },
  component: GroupPage,
});

function GroupPage() {
  const { id } = Route.useParams();
  return (
    <Screen back="Juntos">
      <GroupView id={id} />
    </Screen>
  );
}
