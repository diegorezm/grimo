import { type FeedItem as FeedItemData, useToggleLike } from "@grimo/client";
import { describeActivity, timeAgo } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Stars, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

/** One activity from your network: who did what, the book (tap to open) and the post. */
export function FeedItem({ item }: { item: FeedItemData }) {
  const theme = useTheme();
  const toggleLike = useToggleLike();
  const { actor, book, post } = item;
  const openLibraryId = book?.openLibraryId;

  return (
    <Card>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}>
          <Text variant="label">{actor.name.slice(0, 1)}</Text>
        </View>
        <Text variant="small" style={styles.flex}>
          <Text variant="small" style={styles.bold}>
            {actor.name}
          </Text>{" "}
          <Text variant="small" color="textMuted">
            {describeActivity(item.kind, item.data)}
          </Text>
          {item.target?.name && (
            <Text variant="small" style={styles.bold}>
              {" "}
              {item.target.name}
            </Text>
          )}
        </Text>
        <Text variant="label" color="textMuted">
          {timeAgo(new Date(item.createdAt))}
        </Text>
      </View>

      {book?.id && (
        <Pressable
          accessibilityRole="button"
          disabled={!openLibraryId}
          onPress={() =>
            openLibraryId && router.push({ pathname: "/book/[id]", params: { id: openLibraryId } })
          }
          style={styles.book}
        >
          <BookCover src={book.coverUrl} title={book.title ?? ""} width={44} />
          <View style={styles.flex}>
            <Text variant="title" numberOfLines={2}>
              {book.title}
            </Text>
            <Text variant="small" color="accent" numberOfLines={1}>
              {book.authors?.join(", ")}
            </Text>
            {post?.rating ? <Stars value={post.rating} size={13} /> : null}
          </View>
        </Pressable>
      )}

      {post?.id && (
        <>
          {post.body && (
            <Text style={styles.quote} numberOfLines={6}>
              {post.hasSpoilers ? "Contém spoiler · abra o livro para ler." : post.body}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.likedByMe ? "Descurtir" : "Curtir"}
            onPress={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}
            hitSlop={8}
          >
            <Text variant="label" color={post.likedByMe ? "accent" : "textMuted"}>
              {post.likedByMe ? "♥" : "♡"} {post.likeCount} · {post.commentCount} comentários
            </Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  bold: { fontWeight: "700" },
  book: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1 },
  quote: { fontStyle: "italic" },
});
