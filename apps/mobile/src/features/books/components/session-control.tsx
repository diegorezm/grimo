import { type ActiveSession, useActiveSession, useElapsed, useStartSession } from "@grimo/client";
import { formatTimer } from "@grimo/core";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";

/**
 * "Sessão de leitura" on a book you are reading: start the timer; while it runs, the time and
 * "Terminar", which opens "Registrar leitura" to say where you stopped.
 */
export function SessionControl({
  entryId,
  page,
  book,
}: {
  entryId: string;
  page: number;
  book: ActiveSession["book"];
}) {
  const session = useActiveSession().data;
  const start = useStartSession();
  const elapsed = useElapsed(session?.entryId === entryId ? session.startedAt : null);
  const finish = () =>
    router.push({ pathname: "/progress/[id]", params: { id: book.openLibraryId } });

  if (session?.entryId === entryId) {
    return (
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="label" color="accent">
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
      title={session ? `Trocar a sessão para este livro` : "⏱ Iniciar sessão de leitura"}
      disabled={start.isPending}
      onPress={() => start.mutate({ entryId, book, page })}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  flex: { flex: 1 },
  timer: { fontSize: 28 },
});
