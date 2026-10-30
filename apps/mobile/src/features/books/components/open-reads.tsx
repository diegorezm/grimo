import { errorMessage, type OpenRead, useJoinOpenRead, useOpenReads } from "@grimo/client";
import { membersLabel } from "@grimo/core";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AvatarStack, Button, Card, Text } from "@/components/ui";
import { formatFinishBy } from "@/components/ui/finish-picker";
import { spacing } from "@/constants/theme";

/** "Leituras abertas" of a book: groups anyone can join, without an invite. */
export function OpenReads({ openLibraryId }: { openLibraryId: string }) {
  const reads = useOpenReads(openLibraryId).data?.items ?? [];
  if (reads.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="heading">Leituras abertas</Text>
      <Text color="textMuted">Grupos lendo este livro agora. Qualquer um entra.</Text>
      {reads.map((read) => (
        <OpenReadRow key={read.id} read={read} />
      ))}
    </View>
  );
}

/** One open read: who is in, how far, and "Entrar" (or "Abrir" when you are in). */
export function OpenReadRow({ read, showBook = false }: { read: OpenRead; showBook?: boolean }) {
  const join = useJoinOpenRead();
  const open = (id: string) => router.push({ pathname: "/group/[id]", params: { id } });
  return (
    <Card>
      {showBook && (
        <Text variant="title" numberOfLines={2}>
          {read.book.title}
        </Text>
      )}
      <View style={styles.row}>
        <AvatarStack people={read.members} size={22} />
        <Text variant="small" color="textMuted" style={styles.flex} numberOfLines={2}>
          {membersLabel(
            read.members.map((member) => member.name),
            false,
          )}
        </Text>
      </View>
      <Text variant="label" color="textMuted">
        {read.memberCount} {read.memberCount === 1 ? "leitor" : "leitores"} · grupo em{" "}
        {read.groupPercent}%{read.finishBy ? ` · até ${formatFinishBy(read.finishBy)}` : ""}
      </Text>
      {read.isMember ? (
        <Button variant="ghost" title="Abrir o grupo" onPress={() => open(read.id)} />
      ) : read.full ? (
        <Text variant="label" color="textMuted">
          Lotado
        </Text>
      ) : (
        <Button
          variant="secondary"
          title="Entrar"
          disabled={join.isPending}
          onPress={() => join.mutate(read.id, { onSuccess: ({ id }) => open(id) })}
        />
      )}
      {join.error && <Text color="danger">{errorMessage(join.error)}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  flex: { flex: 1 },
});
