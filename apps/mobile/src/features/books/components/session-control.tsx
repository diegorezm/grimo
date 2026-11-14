import { type ActiveSession, useActiveSession, useElapsed, useStartSession } from "@grimo/client";
import { formatTimer } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Icon, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * "Sessão de leitura" on a book you are reading: start the timer; while it runs, the time and
 * "Terminar", which opens "Registrar leitura" to say where you stopped. `compact`: a round button
 * (the timer icon; while it runs, the time) to sit beside another button.
 */
export function SessionControl({
  entryId,
  page,
  pageCount,
  book,
  compact = false,
}: {
  entryId: string;
  page: number;
  pageCount: number | null;
  book: ActiveSession["book"];
  compact?: boolean;
}) {
  const theme = useTheme();
  const session = useActiveSession().data;
  const start = useStartSession();
  const elapsed = useElapsed(session?.entryId === entryId ? session.startedAt : null);
  const finish = () =>
    router.push({ pathname: "/progress/[id]", params: { id: book.openLibraryId } });

  const mine = session?.entryId === entryId;
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          mine
            ? `Sessão de leitura, ${formatTimer(elapsed)}. Terminar`
            : session
              ? "Trocar a sessão de leitura para este livro"
              : "Iniciar sessão de leitura"
        }
        disabled={start.isPending}
        onPress={() => (mine ? finish() : start.mutate({ entryId, book, page, pageCount }))}
        style={({ pressed }) => [
          styles.round,
          mine && styles.running,
          { borderColor: mine ? theme.accent : theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Icon name="timer" size={20} color={mine ? "accentInk" : "text"} />
        {mine && (
          <Text variant="label" color="accentInk">
            {formatTimer(elapsed)}
          </Text>
        )}
      </Pressable>
    );
  }
  if (mine) {
    return (
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="label" color="accentInk">
            Lendo agora
          </Text>
          <Text variant="number" style={styles.timer}>
            {formatTimer(elapsed)}
          </Text>
        </View>
        <Button title="Terminar" onPress={finish} />
      </View>
    );
  }
  return (
    <Button
      variant="secondary"
      title={session ? "Trocar a sessão para este livro" : "Iniciar sessão de leitura"}
      disabled={start.isPending}
      onPress={() => start.mutate({ entryId, book, page, pageCount })}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  flex: { flex: 1 },
  timer: { fontSize: 28 },
  round: {
    minWidth: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  running: { paddingHorizontal: spacing[3] },
});
