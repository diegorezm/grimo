import {
  errorMessage,
  type PostDetail,
  useAddComment,
  useMe,
  usePost,
  useRemoveComment,
  useRemovePost,
  useToggleLike,
} from "@grimo/client";
import { timeAgo } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Input, Screen, Stars, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { openReport } from "@/features/moderation";
import { useTheme } from "@/hooks/use-theme";

/** A post with its comments: like, comment, delete your own post or comments on it, report. */
export function PostThread({ postId }: { postId: string }) {
  const theme = useTheme();
  const { data, isError } = usePost(postId);

  if (isError) {
    return (
      <Screen>
        <Text color="textMuted">Não encontramos esse post.</Text>
        <Button variant="secondary" title="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }
  return <Thread detail={data} />;
}

function Thread({ detail }: { detail: PostDetail }) {
  const { post, comments } = detail;
  const me = useMe().data;
  const toggleLike = useToggleLike();
  const removePost = useRemovePost();
  const isMine = me?.id === post.author.id;
  const book = post.book;

  function confirmRemovePost() {
    Alert.alert("Apagar post?", "Apaga também curtidas e comentários.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => removePost.mutate(post.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <Button variant="ghost" title="Voltar" onPress={() => router.back()} />
      <Card>
        <AuthorLine author={post.author} createdAt={post.createdAt} />
        {book && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
            }
            style={styles.book}
          >
            <BookCover src={book.coverUrl} title={book.title} width={44} />
            <View style={styles.flex}>
              <Text variant="title" numberOfLines={2}>
                {book.title}
              </Text>
              {post.rating ? <Stars value={post.rating} size={13} /> : null}
            </View>
          </Pressable>
        )}
        <Text>{post.body}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.likedByMe ? "Descurtir" : "Curtir"}
            onPress={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
            hitSlop={8}
          >
            <Text variant="label" color={post.likedByMe ? "accent" : "textMuted"}>
              {post.likedByMe ? "♥" : "♡"} {post.likeCount} · {post.commentCount} comentários
            </Text>
          </Pressable>
          {isMine ? (
            <Pressable accessibilityRole="button" onPress={confirmRemovePost} hitSlop={10}>
              <Text variant="label" color="textMuted">
                Apagar post
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => openReport("post", post.id)}
              hitSlop={10}
            >
              <Text variant="label" color="textMuted">
                Denunciar
              </Text>
            </Pressable>
          )}
        </View>
      </Card>

      <Text variant="heading">Comentários</Text>
      <CommentComposer postId={post.id} />
      {comments.length === 0 ? (
        <Text color="textMuted">Nenhum comentário ainda.</Text>
      ) : (
        comments.map((comment) => (
          <CommentRow
            key={comment.id}
            postId={post.id}
            comment={comment}
            canRemove={me?.id === comment.author.id || isMine}
            canReport={me !== undefined && me.id !== comment.author.id}
          />
        ))
      )}
    </Screen>
  );
}

function CommentRow({
  postId,
  comment,
  canRemove,
  canReport,
}: {
  postId: string;
  comment: PostDetail["comments"][number];
  canRemove: boolean;
  canReport: boolean;
}) {
  const remove = useRemoveComment(postId);

  function confirmRemove() {
    Alert.alert("Apagar comentário?", undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => remove.mutate(comment.id) },
    ]);
  }

  return (
    <Card>
      <AuthorLine author={comment.author} createdAt={comment.createdAt} />
      <Text>{comment.body}</Text>
      {(canRemove || canReport) && (
        <View style={styles.actions}>
          {canRemove && (
            <Pressable accessibilityRole="button" onPress={confirmRemove} hitSlop={10}>
              <Text variant="label" color="textMuted">
                Apagar
              </Text>
            </Pressable>
          )}
          {canReport && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openReport("comment", comment.id)}
              hitSlop={10}
            >
              <Text variant="label" color="textMuted">
                Denunciar
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

/** Photo, name and time; opens the author's profile. */
function AuthorLine({
  author,
  createdAt,
}: {
  author: PostDetail["post"]["author"];
  createdAt: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Perfil de ${author.name}`}
      onPress={() =>
        router.push({ pathname: "/u/[username]", params: { username: author.username } })
      }
      style={styles.author}
    >
      <Avatar image={author.image} name={author.name} size={28} />
      <Text variant="small" style={styles.bold}>
        {author.name}
      </Text>
      <Text variant="small" color="textMuted">
        {timeAgo(new Date(createdAt))}
      </Text>
    </Pressable>
  );
}

function CommentComposer({ postId }: { postId: string }) {
  const add = useAddComment(postId);
  const [body, setBody] = useState("");

  return (
    <View style={styles.composer}>
      <Input
        placeholder="Escreva um comentário"
        multiline
        maxLength={2000}
        value={body}
        onChangeText={setBody}
      />
      {add.error && <Text color="danger">{errorMessage(add.error)}</Text>}
      <Button
        title="Comentar"
        disabled={!body.trim() || add.isPending}
        onPress={() => add.mutate(body.trim(), { onSuccess: () => setBody("") })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  author: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bold: { fontWeight: "700" },
  book: { flexDirection: "row", gap: spacing[3] },
  composer: { gap: spacing[2] },
  flex: { flex: 1 },
});
