import { type BookSearchResult, errorMessage, useCreateGroup } from "@grimo/client";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text } from "@/components/ui";
import { FinishPicker, finishByFor } from "@/components/ui/finish-picker";
import { spacing } from "@/constants/theme";

/**
 * "Ler com alguém" on a book: pick when to finish (optional), create the group, then invite
 * people from the group screen.
 */
export function StartGroup({ book }: { book: BookSearchResult }) {
  const create = useCreateGroup();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number | null>(30);

  if (!open) {
    return <Button variant="secondary" title="Ler com alguém" onPress={() => setOpen(true)} />;
  }

  function start() {
    create.mutate(
      { book, finishBy: finishByFor(days) },
      { onSuccess: ({ id }) => router.push({ pathname: "/group/[id]", params: { id } }) },
    );
  }

  return (
    <Card>
      <Text variant="title">Ler com alguém</Text>
      <Text color="textMuted">
        Você cria o grupo e manda o link. Cada um vê o progresso de todos, e a conversa abre
        conforme você lê: ninguém leva spoiler.
      </Text>
      <Text variant="label" color="textMuted">
        Terminar em
      </Text>
      <FinishPicker days={days} onChange={setDays} />
      {create.error && <Text color="danger">{errorMessage(create.error)}</Text>}
      <View style={styles.actions}>
        <Button
          variant="ghost"
          title="Cancelar"
          onPress={() => setOpen(false)}
          style={styles.flex}
        />
        <Button
          title="Criar grupo"
          onPress={start}
          disabled={create.isPending}
          style={styles.flex}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing[3] },
  flex: { flex: 1 },
});
