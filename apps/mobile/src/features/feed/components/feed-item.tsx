import { type FeedItem as FeedItemData, useMe, useSetBlocked, useToggleLike } from "@grimo/client";
import { commentCountLabel, describeActivity, timeAgo } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, MentionText, Stars, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { showPostActions } from "@/features/moderation";

/** One activity from your network: who did what, the book (tap to open) and the post. */
export function FeedItem({ item }: { item: FeedItemData }) {
  const toggleLike = useToggleLike();
  const setBlocked = useSetBlocked();
  const me = useMe().data;
  const { actor, book, post } = item;
  const openLibraryId = book?.openLibraryId;

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${actor.name}`}
        onPress={() =>
          router.push({ pathname: "/u/[username]", params: { username: actor.username } })
        }
        style={styles.head}
      >
        <Avatar image={actor.image} name={actor.name} />
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
      </Pressable>

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
            <MentionText
              style={styles.quote}
              numberOfLines={6}
              text={post.hasSpoilers ? "Contém spoiler · abra o livro para ler." : post.body}
            />
          )}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={post.likedByMe ? "Descurtir" : "Curtir"}
              onPress={() => toggleLike.mutate({ postId: post.id!, like: !post.likedByMe })}
              hitSlop={8}
            >
              <Text variant="label" color={post.likedByMe ? "accent" : "textMuted"}>
                {post.likedByMe ? "♥" : "♡"} {post.likeCount}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver comentários"
              onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id! } })}
              hitSlop={8}
              style={styles.flex}
            >
              <Text variant="label" color="textMuted">
                {commentCountLabel(post.commentCount)}
              </Text>
            </Pressable>
            {me?.id !== actor.id && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Denunciar ou bloquear"
                onPress={() =>
                  showPostActions({
                    postId: post.id!,
                    author: actor,
                    block: (userId) => setBlocked.mutate({ userId, block: true }),
                  })
                }
                hitSlop={10}
              >
                <Text variant="label" color="textMuted">
                  ⋯
                </Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bold: { fontWeight: "700" },
  book: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1 },
  quote: { fontStyle: "italic" },
});
