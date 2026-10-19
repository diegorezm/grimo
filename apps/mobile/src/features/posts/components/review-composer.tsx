import { errorMessage, useBook, useCreatePost, useUpdateShelfEntry } from "@grimo/client";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, TextInput, View } from "react-native";
import { Button, Stars, Text } from "@/components/ui";
import { Fonts, fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Review composer: rating, text on ruled paper and a spoiler switch. */
export function ReviewComposer({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const { data } = useBook(openLibraryId);
  const createPost = useCreatePost();
  const updateEntry = useUpdateShelfEntry();
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!data?.book.id) return null;

  const bookId = data.book.id;
  const entry = data.entry;
  const value = rating ?? entry?.rating ?? null;

  async function publish() {
    setError(null);
    try {
      await createPost.mutateAsync({
        kind: "review",
        bookId,
        rating: value,
        body,
        hasSpoilers: spoiler,
      });
      if (entry && value !== entry.rating) updateEntry.mutate({ id: entry.id, rating: value });
      router.back();
    } catch (e) {
      setError(errorMessage(e, "Não foi possível publicar"));
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="heading">Nova resenha</Text>
        <Text color="textMuted" numberOfLines={1}>
          {data.book.title}
        </Text>
      </View>

      <View style={styles.center}>
        <Stars value={value} size={34} onChange={setRating} />
      </View>

      <TextInput
        multiline
        value={body}
        onChangeText={setBody}
        placeholder="O que esse livro deixou em você?"
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Texto da resenha"
        style={[
          styles.paper,
          { backgroundColor: theme.surface, borderColor: theme.edge, color: theme.text },
        ]}
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.bold}>Contém spoiler</Text>
          <Text variant="small" color="textMuted">
            O texto fica oculto até o leitor tocar
          </Text>
        </View>
        <Switch
          value={spoiler}
          onValueChange={setSpoiler}
          trackColor={{ true: theme.accent, false: theme.border }}
          accessibilityLabel="Contém spoiler"
        />
      </View>

      {error && <Text color="danger">{error}</Text>}
      <Button
        title="Publicar"
        onPress={publish}
        disabled={createPost.isPending || body.trim().length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[4] },
  header: { gap: spacing[1] },
  center: { alignItems: "center" },
  paper: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
    fontFamily: Fonts.serif,
    fontSize: fontSize.md,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  flex: { flex: 1 },
  bold: { fontWeight: "700" },
});
