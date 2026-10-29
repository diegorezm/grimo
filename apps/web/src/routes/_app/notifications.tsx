import { notificationsQuery } from "@grimo/client";
import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/layout/screen";
import { NotificationList } from "@/features/notifications";

export const Route = createFileRoute("/_app/notifications")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(notificationsQuery());
  },
  component: () => (
    <Screen title="Notificações" subtitle="Quem seguiu, curtiu, comentou ou mencionou você.">
      <NotificationList />
    </Screen>
  ),
});
