import { friendsWantQuery, groupsQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { GroupList } from "@/features/groups";

export const Route = createFileRoute("/_app/juntos/")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(groupsQuery());
    void queryClient.prefetchQuery(friendsWantQuery());
  },
  component: () => (
    <Screen title="Juntos" subtitle="Ler o mesmo livro com outras pessoas, no ritmo de cada um.">
      <GroupList />
    </Screen>
  ),
});
