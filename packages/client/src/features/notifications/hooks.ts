import { api } from "@grimo/backend";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { convexQuery, convexQueryPrefix } from "../../lib/convex-cache";
import { useGrowingList } from "../../lib/list";
import { usePatchQueries } from "../../lib/mutation";
import { useConvexCache } from "../../lib/provider";
import { PAGE_SIZE } from "../../lib/query";

export type NotificationPage = FunctionReturnType<typeof api.notifications.list>;
export type NotificationItem = NotificationPage["items"][number];

/** First page of the notifications (route loaders prefetch it). */
export function notificationsQuery() {
  return convexQuery(api.notifications.list, { limit: PAGE_SIZE }, "required");
}

export function unreadNotificationsQuery() {
  return convexQuery(api.notifications.unreadCount, {}, "required");
}

/** Follows, likes, comments and mentions, newest first. Live. */
export function useNotifications() {
  return useGrowingList(api.notifications.list, {}, "required");
}

/** Unread count for the bell's badge. Live. */
export function useUnreadNotifications() {
  return useQuery(unreadNotificationsQuery());
}

/** Clears the badge and the unread dots at once (the server catches up). */
export function useMarkNotificationsRead() {
  const { convex } = useConvexCache();
  const patchQueries = usePatchQueries();
  return useMutation({
    mutationFn: () => convex.mutation(api.notifications.markAllRead, {}),
    onMutate: async () => {
      const [count, lists] = await Promise.all([
        patchQueries<number>([convexQueryPrefix(api.notifications.unreadCount)], () => 0),
        patchQueries<NotificationPage>([convexQueryPrefix(api.notifications.list)], (data) => ({
          ...data,
          items: data.items.map((item) => (item.read ? item : { ...item, read: true })),
        })),
      ]);
      return () => {
        count();
        lists();
      };
    },
    onError: (_error, _input, rollback) => rollback?.(),
  });
}

/** "Seguir de volta" in the notifications follows the reader's new state right away. */
export function followInNotifications(
  data: NotificationPage,
  userId: string,
  follow: boolean,
): NotificationPage {
  return {
    ...data,
    items: data.items.map((item) =>
      item.kind === "follow" && item.actor.id === userId
        ? { ...item, followingActor: follow }
        : item,
    ),
  };
}
