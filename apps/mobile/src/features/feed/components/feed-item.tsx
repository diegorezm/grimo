import { type FeedItem as FeedItemData, useToggleLike } from "@grimo/client";
import { describeActivity } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";

export function FeedItem({ item }: { item: FeedItemData }) {
  const toggleLike = useToggleLike();
  const { actor, book, post } = item;

  return (
    <Card>
      <Text variant="small">
        <Text variant="small" style={styles.bold}>
          {actor.name}
        </Text>{" "}
        <Text variant="small" color="textMuted">
          {describeActivity(item.kind, item.data)}
        </Text>
      </Text>

      {book?.id && (
        <View style={styles.book}>
          <BookCover src={book.coverUrl} title={book.title ?? ""} width={44} />
          <View style={styles.flex}>
            <Text variant="title">{book.title}</Text>
            <Text variant="small" color="textMuted">
              {book.authors?.join(", ")}
            </Text>
          </View>
        </View>
      )}

      {post?.id && (
        <>
          <Text>{post.body}</Text>
          <Pressable onPress={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}>
            <Text variant="small" color="textMuted">
              {post.likedByMe ? "♥" : "♡"} {post.likeCount} · {post.commentCount} comentários
            </Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  book: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1 },
});
