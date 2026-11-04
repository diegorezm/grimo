import { errorMessage, useBook, useCreatePost } from "@grimo/client";
import { createPostSchema, firstIssue, QUOTE_MAX_LENGTH } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Button, Input, Text } from "@/components/ui";
import { Fonts, fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** "Guardar citação": a passage of the book and its page (Skoob's citações). */
export function QuoteComposer({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const { data } = useBook(openLibraryId);
  const create = useCreatePost();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!data?.book.id) return null;
  const bookId = data.book.id;

  function publish() {
    const input = createPostSchema.safeParse({
      kind: "quote",
      bookId,
      body,
      page: page.trim() === "" ? null : Number(page),
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    create.mutate(input.data, {
      onSuccess: () => router.back(),
      onError: (failure) => setError(errorMessage(failure, "Não foi possível guardar")),
    });
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="heading">Guardar citação</Text>
        <Text color="textMuted" numberOfLines={1}>
          {data.book.title}
        </Text>
      </View>
      <TextInput
        multiline
        value={body}
        onChangeText={setBody}
        maxLength={QUOTE_MAX_LENGTH}
        placeholder="Um trecho que você quer guardar…"
        placeholderTextColor={theme.textMuted}
        accessibilityLabel="Trecho do livro"
        style={[
          styles.paper,
          { backgroundColor: theme.surface, borderColor: theme.edge, color: theme.text },
        ]}
      />
      <View style={styles.row}>
        <Text variant="label" color="textMuted" style={styles.flex}>
          Página
        </Text>
        <Input
          value={page}
          onChangeText={(text) => setPage(text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          placeholder={data.book.pageCount ? `1–${data.book.pageCount}` : "—"}
          accessibilityLabel="Página da citação"
          style={styles.page}
        />
      </View>
      {error && <Text color="danger">{error}</Text>}
      <Button
        title="Guardar"
        onPress={publish}
        disabled={create.isPending || body.trim().length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[4] },
  header: { gap: spacing[1] },
  paper: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
    fontFamily: Fonts.serif,
    fontStyle: "italic",
    fontSize: fontSize.md,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  page: { width: 110, textAlign: "center", paddingVertical: spacing[2] },
  flex: { flex: 1 },
});
