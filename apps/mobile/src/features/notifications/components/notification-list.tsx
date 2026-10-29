import {
  type NotificationItem,
  useMarkNotificationsRead,
  useMe,
  useNotifications,
  useUnreadNotifications,
} from "@grimo/client";
import { describeNotification, timeAgo } from "@grimo/core";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Button, Screen, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { FollowButton } from "@/features/readers";
import { useTheme } from "@/hooks/use-theme";

/** Follows, likes, comments and mentions. Opening the screen marks them read. */
export function NotificationList() {
  const theme = useTheme();
  const list = useNotifications();
  const unread = useUnreadNotifications().data ?? 0;
  const { mutate } = useMarkNotificationsRead();
  const items = list.data?.items ?? [];

  // Seen once the list is on screen; new ones arriving while it is open get marked too.
  useEffect(() => {
    if (unread > 0 && list.data) mutate();
  }, [unread, list.data, mutate]);

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      </View>
      <Text variant="display">Notificações</Text>
      {list.isPending ? (
        <ActivityIndicator color={theme.accent} />
      ) : items.length === 0 ? (
        <Text color="textMuted">
          Nada por aqui ainda. Quando alguém seguir você, curtir, comentar ou mencionar você com @,
          aparece aqui.
        </Text>
      ) : (
        items.map((item) => <Row key={item.id} item={item} />)
      )}
      {list.hasNextPage && (
        <Button
          variant="secondary"
          title={list.isFetchingNextPage ? "Carregando…" : "Ver mais"}
          onPress={list.fetchNextPage}
        />
      )}
    </Screen>
  );
}

function Row({ item }: { item: NotificationItem }) {
  const theme = useTheme();
  const meId = useMe().data?.id;
  const { actor, post, comment } = item;
  const text = describeNotification(item.kind, {
    postKind: post?.kind,
    inComment: comment !== null,
  });
  const quote = comment?.snippet ?? (item.kind === "mention" ? post?.snippet : null);
  const open = () =>
    post
      ? router.push({ pathname: "/post/[id]", params: { id: post.id } })
      : router.push({ pathname: "/u/[username]", params: { username: actor.username } });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => [
        styles.row,
        !item.read && { backgroundColor: theme.surfaceMuted },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Avatar image={actor.image} name={actor.name} size={40} />
      <View style={styles.text}>
        <Text>
          <Text style={styles.name}>{actor.name}</Text> {text}
          {post?.book ? <Text color="textMuted"> · {post.book.title}</Text> : null}
        </Text>
        {quote ? (
          <Text variant="small" color="textMuted" numberOfLines={2}>
            “{quote}”
          </Text>
        ) : null}
        <Text variant="label" color="textMuted">
          {timeAgo(new Date(item.createdAt))}
        </Text>
      </View>
      {item.kind === "follow" && item.followingActor !== null && actor.id !== meId && (
        <FollowButton userId={actor.id} isFollowing={item.followingActor} followsYou compact />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[2],
    borderRadius: radius.md,
  },
  text: { flex: 1, gap: 2 },
  name: { fontWeight: "700" },
});
