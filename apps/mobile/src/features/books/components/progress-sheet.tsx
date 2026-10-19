import { useBook, useUpdateShelfEntry } from "@grimo/client";
import { readingPercent } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** "Registrar leitura": a page stepper for the book you are reading, or mark it as finished. */
export function ProgressSheet({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const { data } = useBook(openLibraryId);
  const update = useUpdateShelfEntry();
  const entry = data?.entry;
  const pageCount = data?.book.pageCount ?? null;
  const [page, setPage] = useState<number | null>(null);
  if (!data || !entry) return null;

  const current = page ?? entry.currentPage;
  const max = pageCount ?? Number.MAX_SAFE_INTEGER;
  const set = (value: number) => setPage(Math.min(max, Math.max(0, value)));
  const percent = readingPercent(current, pageCount);

  function save() {
    update.mutate({ id: entry!.id, currentPage: current });
    router.back();
  }

  function finish() {
    update.mutate({
      id: entry!.id,
      status: "read",
      ...(pageCount ? { currentPage: pageCount } : {}),
    });
    router.back();
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="heading">Registrar leitura</Text>
        <Text color="textMuted" numberOfLines={1}>
          {data.book.title}
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

      <View style={styles.actions}>
        <Button variant="secondary" title="Terminei o livro" onPress={finish} style={styles.flex} />
        <Button title="Salvar" onPress={save} disabled={update.isPending} style={styles.flex} />
      </View>
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
  flex: { flex: 1 },
});
