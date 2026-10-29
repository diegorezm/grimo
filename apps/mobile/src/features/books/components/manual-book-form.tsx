import { errorMessage, useAddManualBook } from "@grimo/client";
import {
  firstIssue,
  manualBookSchema,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
  splitAuthors,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const optionalNumber = (text: string) => (text.trim() === "" ? null : Number(text));

/**
 * "Cadastrar livro" for what Open Library doesn't have. It goes on your shelf at once; others see
 * it after moderation approves it.
 */
export function ManualBookForm({
  initialTitle = "",
  onCancel,
}: {
  initialTitle?: string;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const add = useAddManualBook();
  const [form, setForm] = useState({ title: initialTitle, authors: "", pages: "", year: "" });
  const [status, setStatus] = useState<ShelfStatus>("reading");
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  function submit() {
    const input = manualBookSchema.safeParse({
      title: form.title,
      authors: splitAuthors(form.authors),
      pageCount: optionalNumber(form.pages),
      publishedYear: optionalNumber(form.year),
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    add.mutate(
      { ...input.data, status },
      {
        onSuccess: ({ openLibraryId }) =>
          router.push({ pathname: "/book/[id]", params: { id: openLibraryId } }),
        onError: (failure) => setError(errorMessage(failure)),
      },
    );
  }

  return (
    <Card>
      <Text variant="heading">Cadastrar livro</Text>
      <Text color="textMuted">
        Ele entra na sua estante agora. Para os outros leitores, aparece depois que a gente revisar.
      </Text>
      <Input placeholder="Título" value={form.title} onChangeText={set("title")} />
      <Input
        placeholder="Autor (separe vários por vírgula)"
        value={form.authors}
        onChangeText={set("authors")}
      />
      <View style={styles.row}>
        <Input
          placeholder="Páginas"
          keyboardType="number-pad"
          value={form.pages}
          onChangeText={(text) => set("pages")(text.replace(/\D/g, ""))}
          style={styles.flex}
        />
        <Input
          placeholder="Ano"
          keyboardType="number-pad"
          value={form.year}
          onChangeText={(text) => set("year")(text.replace(/\D/g, ""))}
          style={styles.flex}
        />
      </View>
      <View style={styles.chips}>
        {SHELF_STATUSES.map((option) => {
          const active = status === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setStatus(option)}
              style={[
                styles.chip,
                { borderColor: active ? theme.accent : theme.border },
                active && { backgroundColor: theme.surfaceMuted },
              ]}
            >
              <Text variant="label" color={active ? "accent" : "textMuted"}>
                {SHELF_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && <Text color="danger">{error}</Text>}
      <View style={styles.row}>
        <Button variant="ghost" title="Cancelar" onPress={onCancel} style={styles.flex} />
        <Button title="Cadastrar" onPress={submit} disabled={add.isPending} style={styles.flex} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
