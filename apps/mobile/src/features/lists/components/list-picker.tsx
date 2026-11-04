import { bookInputOf, useAddToList, useBook, useMyLists, useRemoveFromList } from "@grimo/client";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** "Adicionar a uma lista": tick the lists a book goes on. */
export function ListPicker({ openLibraryId }: { openLibraryId: string }) {
  const theme = useTheme();
  const book = useBook(openLibraryId).data?.book;
  const lists = useMyLists(openLibraryId).data?.items;
  const add = useAddToList();
  const remove = useRemoveFromList();
  if (!book) return null;
  const input = bookInputOf(book);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="heading">Adicionar a uma lista</Text>
        <Text color="textMuted" numberOfLines={1}>
          {book.title}
        </Text>
      </View>
      {lists?.length === 0 && <Text color="textMuted">Você ainda não tem listas.</Text>}
      {lists?.map((list) => (
        <Pressable
          key={list.id}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: list.hasBook }}
          onPress={() =>
            list.hasBook
              ? remove.mutate({ id: list.id, openLibraryId })
              : add.mutate({ id: list.id, book: input })
          }
          style={[
            styles.row,
            { borderColor: list.hasBook ? theme.accent : theme.border },
            list.hasBook && { backgroundColor: theme.surfaceMuted },
          ]}
        >
          <Text style={styles.flex} numberOfLines={1}>
            {list.title}
          </Text>
          <Text variant="label" color={list.hasBook ? "accent" : "textMuted"}>
            {list.hasBook ? "✓ Na lista" : `${list.itemCount}`}
          </Text>
        </Pressable>
      ))}
      <Button variant="secondary" title="Nova lista" onPress={() => router.push("/new-list")} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[3] },
  header: { gap: spacing[1], marginBottom: spacing[2] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing[3],
  },
  flex: { flex: 1 },
});
