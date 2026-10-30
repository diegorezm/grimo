import {
  useActiveSession,
  useBook,
  useDiscardSession,
  useElapsed,
  useFinishSession,
  useUpdateShelfEntry,
} from "@grimo/client";
import {
  editionPages,
  firstIssue,
  formatTimer,
  readingPercent,
  updateNoteSchema,
  updateShelfEntrySchema,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Input, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * "Registrar leitura": a page stepper for the book you are reading, or mark it as finished. The
 * pages of your edition can be set here too (empty: the book's), and a comment that shows in
 * the feed with the page (Skoob's comentário de leitura). With a session running on this book,
 * "Salvar" ends it: the feed says how long you read.
 */
export function ProgressSheet({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const { data } = useBook(openLibraryId);
  const update = useUpdateShelfEntry();
  const active = useActiveSession().data;
  const finishSession = useFinishSession();
  const discardSession = useDiscardSession();
  const entry = data?.entry;
  const session = active && active.entryId === entry?.id ? active : null;
  const elapsed = useElapsed(session?.startedAt);
  const bookPages = data?.book.pageCount ?? null;
  const [page, setPage] = useState<number | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  if (!data || !entry) return null;

  const editionText = edition ?? String(editionPages(entry.pageCount, bookPages) ?? "");
  // Empty or the book's own number: no edition of your own.
  const editionValue =
    editionText.trim() === "" || Number(editionText) === bookPages ? null : Number(editionText);
  const parsedEdition = updateShelfEntrySchema.shape.pageCount.safeParse(editionValue);
  const pageCount = editionPages(parsedEdition.success ? editionValue : entry.pageCount, bookPages);
  const editionPatch =
    parsedEdition.success && editionValue !== entry.pageCount ? { pageCount: editionValue } : {};

  const current = page ?? entry.currentPage;
  const max = pageCount ?? Number.MAX_SAFE_INTEGER;
  const set = (value: number) => setPage(Math.min(max, Math.max(0, value)));
  const percent = readingPercent(current, pageCount);

  function valid() {
    if (parsedEdition.success) return true;
    setError(firstIssue(parsedEdition.error));
    return false;
  }

  /** The comment to publish with this update, `undefined` without one, or null when invalid. */
  function noteFor(finishing: boolean) {
    if (comment.trim() === "") return undefined;
    const note = updateNoteSchema.safeParse({ body: comment, hasSpoilers });
    if (!note.success) {
      setError(firstIssue(note.error));
      return null;
    }
    if (!finishing && current === entry!.currentPage) {
      setError("Marque a página nova para comentar a leitura.");
      return null;
    }
    return note.data;
  }

  function save() {
    const note = noteFor(false);
    if (!valid() || note === null) return;
    if (session) {
      if (Object.keys(editionPatch).length > 0) update.mutate({ id: entry!.id, ...editionPatch });
      finishSession.mutate({
        page: Math.min(current, pageCount ?? current),
        ...(note && { note }),
      });
      router.back();
      return;
    }
    update.mutate({
      id: entry!.id,
      currentPage: Math.min(current, pageCount ?? current),
      ...editionPatch,
      ...(note && { note }),
    });
    router.back();
  }

  function finish() {
    const note = noteFor(true);
    if (!valid() || note === null) return;
    update.mutate({
      id: entry!.id,
      status: "read",
      ...editionPatch,
      ...(pageCount ? { currentPage: pageCount } : {}),
      ...(note && { note }),
    });
    router.back();
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="heading">{session ? "Terminar sessão" : "Registrar leitura"}</Text>
        <Text color="textMuted" numberOfLines={1}>
          {data.book.title}
          {session ? ` · ⏱ ${formatTimer(elapsed)}` : ""}
        </Text>
      </View>

      <View style={[styles.stepper, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
        <Step
          label="−10"
          accessibilityLabel="Dez páginas a menos"
          onPress={() => set(current - 10)}
        />
        <Step label="−" accessibilityLabel="Uma página a menos" onPress={() => set(current - 1)} />
        <View style={styles.value}>
          <Text variant="number" style={styles.big}>
            {current}
          </Text>
          <Text variant="label" color="textMuted">
            {pageCount ? `de ${pageCount}` : "página"}
          </Text>
        </View>
        <Step label="+" accessibilityLabel="Uma página a mais" onPress={() => set(current + 1)} />
        <Step
          label="+10"
          accessibilityLabel="Dez páginas a mais"
          onPress={() => set(current + 10)}
        />
      </View>

      {percent !== null && (
        <View style={styles.gap}>
          <ProgressBar percent={percent} height={8} />
          <Text variant="label" color="textMuted" style={styles.end}>
            {percent}% · +{Math.max(0, current - entry.currentPage)} páginas hoje
          </Text>
        </View>
      )}

      <View style={styles.edition}>
        <Text variant="label" color="textMuted" style={styles.flex}>
          Páginas da sua edição
        </Text>
        <Input
          value={editionText}
          onChangeText={(text) => {
            setEdition(text.replace(/\D/g, ""));
            setError(null);
          }}
          keyboardType="number-pad"
          placeholder={bookPages ? String(bookPages) : "páginas"}
          accessibilityLabel="Páginas da sua edição"
          style={styles.editionInput}
        />
      </View>
      <View style={styles.gap}>
        <Input
          value={comment}
          onChangeText={(text) => {
            setComment(text);
            setError(null);
          }}
          multiline
          maxLength={2000}
          placeholder="Comentar a leitura (opcional): aparece no feed"
          accessibilityLabel="Comentário sobre a leitura"
          style={styles.comment}
        />
        {comment.trim() !== "" && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasSpoilers }}
            onPress={() => setHasSpoilers(!hasSpoilers)}
            style={[
              styles.spoiler,
              { borderColor: hasSpoilers ? theme.accent : theme.border },
              hasSpoilers && { backgroundColor: theme.surfaceMuted },
            ]}
          >
            <Text variant="label" color={hasSpoilers ? "accent" : "textMuted"}>
              {hasSpoilers ? "✓ Tem spoiler" : "Tem spoiler?"}
            </Text>
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="small" color="danger">
          {error}
        </Text>
      )}

      <View style={styles.actions}>
        <Button variant="secondary" title="Terminei o livro" onPress={finish} style={styles.flex} />
        <Button
          title={session ? "Terminar sessão" : "Salvar"}
          onPress={save}
          disabled={update.isPending || finishSession.isPending}
          style={styles.flex}
        />
      </View>
      {session && (
        <Button
          variant="ghost"
          title="Descartar a sessão"
          onPress={() => {
            discardSession.mutate();
            router.back();
          }}
        />
      )}
    </View>
  );
}

function Step({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text variant="label" color="accent" style={styles.stepText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[5] },
  header: { gap: spacing[1] },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[3],
  },
  value: { alignItems: "center", flex: 1 },
  big: { fontSize: 40 },
  step: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 14 },
  gap: { gap: spacing[1] },
  end: { alignSelf: "flex-end" },
  actions: { flexDirection: "row", gap: spacing[3] },
  edition: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  editionInput: { width: 96, textAlign: "center", paddingVertical: spacing[2] },
  comment: { minHeight: 72, textAlignVertical: "top" },
  spoiler: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  flex: { flex: 1 },
});
