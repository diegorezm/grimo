import { toast, useBook, useUpdateShelfEntry } from "@grimo/client";
import {
  editionPages,
  type Feeling,
  firstIssue,
  formatRating,
  shelfMoveMessage,
  updateNoteSchema,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button, FeelingPicker, Input, Stars, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const DAY_MS = 24 * 60 * 60 * 1000;
const WHEN = [
  { label: "Hoje", daysAgo: 0 },
  { label: "Ontem", daysAgo: 1 },
] as const;

/**
 * "Terminou?": moving a book to Lidos is a moment, not a tap. The date, the rating, how it made
 * you feel (suggested from the reading diary), a line about it and whether the feed hears about
 * it, then one "Concluir leitura".
 */
export function FinishSheet({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const { data } = useBook(openLibraryId);
  const update = useUpdateShelfEntry();
  const entry = data?.entry;
  const [daysAgo, setDaysAgo] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [feelings, setFeelings] = useState<Feeling[] | null>(null);
  const [comment, setComment] = useState("");
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);
  if (!data || !entry) return null;

  const { book, diary } = data;
  const chosenRating = rating ?? entry.rating;
  // Until the reader picks, the feelings the diary marked most are already chosen.
  const chosenFeelings = feelings ?? (entry.feelings.length > 0 ? entry.feelings : diary.suggested);
  const pages = editionPages(entry.pageCount, book.pageCount);

  function conclude() {
    let note: { body: string; hasSpoilers: boolean } | undefined;
    if (publish && comment.trim() !== "") {
      const parsed = updateNoteSchema.safeParse({ body: comment, hasSpoilers: false });
      if (!parsed.success) return setError(firstIssue(parsed.error));
      note = parsed.data;
    }
    const input = {
      id: entry!.id,
      status: "read" as const,
      finishedAt: new Date(Date.now() - daysAgo * DAY_MS),
      ...(pages ? { currentPage: pages } : {}),
      rating: chosenRating,
      feelings: chosenFeelings,
      publish,
      ...(note && { note }),
    };
    const send = () => update.mutate(input, { onError: (failure) => toast.failed(failure, send) });
    send();
    router.back();
    toast.saved(
      [
        shelfMoveMessage(book.title, "read"),
        chosenRating !== null && `nota ${formatRating(chosenRating)}`,
        !publish && "sem publicar",
      ]
        .filter(Boolean)
        .join(" · "),
      {
        label: "Card",
        run: () => router.push({ pathname: "/book-card/[id]", params: { id: openLibraryId } }),
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text variant="label" color="textMuted">
          Mover para Lidos
        </Text>
        <Text variant="display">Terminou {book.title}?</Text>
      </View>

      <View style={styles.row}>
        <Text>Terminei</Text>
        <View style={styles.chips}>
          {WHEN.map((option) => {
            const active = daysAgo === option.daysAgo;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setDaysAgo(option.daysAgo)}
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  active && { backgroundColor: theme.inverse, borderColor: theme.inverse },
                ]}
              >
                <Text variant="label" style={active && { color: theme.inverseForeground }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.center}>
        <Text variant="label" color="textMuted">
          Sua nota{chosenRating !== null ? ` · ${formatRating(chosenRating)}` : ""}
        </Text>
        <Stars value={chosenRating} size={40} onChange={setRating} />
      </View>

      <FeelingPicker value={chosenFeelings} suggested={diary.suggested} onChange={setFeelings} />

      <View style={styles.row}>
        <Text style={styles.grow}>Publicar no feed dos seus seguidores</Text>
        <Switch
          value={publish}
          onValueChange={setPublish}
          trackColor={{ true: theme.accent, false: theme.border }}
        />
      </View>
      {publish && (
        <Input
          placeholder="Uma frase sobre o livro (opcional)"
          value={comment}
          onChangeText={(text) => {
            setError(null);
            setComment(text);
          }}
          multiline
        />
      )}
      {error && <Text color="danger">{error}</Text>}

      <Button title="Concluir leitura" onPress={conclude} />
      <Button variant="ghost" title="Agora não" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[10] },
  header: { gap: spacing[1] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  chips: { flexDirection: "row", gap: spacing[2] },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderRadius: radius.full,
    justifyContent: "center",
  },
  center: { alignItems: "center", gap: spacing[1] },
  grow: { flex: 1 },
});
