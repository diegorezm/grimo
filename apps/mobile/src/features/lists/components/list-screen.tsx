import { useList, useRemoveFromList, useRemoveList } from "@grimo/client";
import { bookCountLabel } from "@grimo/core";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";
import { openReport } from "@/features/moderation";
import { useTheme } from "@/hooks/use-theme";

const WIDTH = 100;

/** A reader's list, with its books and why each is there. */
export function ListScreen({ id }: { id: string }) {
  const theme = useTheme();
  const list = useList(id);
  const removeBook = useRemoveFromList();
  const removeList = useRemoveList();

  if (list.isPending) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }
  const data = list.data;

  function confirmDelete() {
    Alert.alert("Apagar esta lista?", "Os livros continuam nas suas estantes.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => removeList.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      </View>
      {!data ? (
        <Text color="textMuted">Essa lista não existe mais.</Text>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="display">{data.title}</Text>
            {data.description ? <Text color="textMuted">{data.description}</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/u/[username]",
                  params: { username: data.owner.username },
                })
              }
            >
              <Text variant="label" color="textMuted">
                {data.owner.name} · {bookCountLabel(data.items.length)}
              </Text>
            </Pressable>
          </View>
          {data.items.length === 0 && (
            <Text color="textMuted">
              {data.isMine
                ? "Lista vazia. Na página de qualquer livro, use “Adicionar a uma lista”."
                : "Essa lista ainda não tem livros."}
            </Text>
          )}
          <View style={styles.grid}>
            {data.items.map((item) => (
              <View key={item.id} style={[styles.item, { width: WIDTH }]}>
                <BookTile book={item.book} width={WIDTH} />
                {item.note ? (
                  <Text variant="small" color="textMuted" numberOfLines={3}>
                    {item.note}
                  </Text>
                ) : null}
                {data.isMine && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      removeBook.mutate({ id, openLibraryId: item.book.openLibraryId })
                    }
                    hitSlop={6}
                  >
                    <Text variant="label" color="textMuted">
                      Tirar
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          {data.isMine ? (
            <View style={styles.actions}>
              <Button
                variant="secondary"
                title="Editar"
                onPress={() => router.push({ pathname: "/new-list", params: { id } })}
              />
              <Button variant="ghost" title="Apagar lista" onPress={confirmDelete} />
            </View>
          ) : (
            <Button
              variant="ghost"
              title="Denunciar lista"
              onPress={() => openReport("list", id)}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row" },
  header: { gap: spacing[2] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[4] },
  item: { gap: spacing[1] },
  actions: { gap: spacing[2] },
});
