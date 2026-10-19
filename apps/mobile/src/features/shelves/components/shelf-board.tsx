import { useShelf, useShelfTabStore } from "@grimo/client";
import { SHELF_LABELS } from "@grimo/core";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";
import { ShelfTiles } from "./shelf-tiles";

/** Shelf tiles on top, the chosen shelf below as a grid of standing books. */
export function ShelfBoard() {
  const theme = useTheme();
  const { status } = useShelfTabStore();
  const shelf = useShelf(status);
  const items = shelf.data?.items ?? [];

  return (
    <View style={styles.root}>
      <ShelfTiles />
      <Text variant="heading">{SHELF_LABELS[status]}</Text>
      {shelf.isPending && <ActivityIndicator color={theme.accent} />}
      {!shelf.isPending && items.length === 0 && (
        <Text color="textMuted">Nenhum livro aqui ainda. Use a busca para adicionar.</Text>
      )}
      <View style={styles.grid}>
        {items.map(({ entry, book }) => (
          <BookTile
            key={entry.id}
            book={book}
            width={100}
            currentPage={entry.status === "reading" ? entry.currentPage : undefined}
            rating={entry.status === "read" ? entry.rating : null}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
    justifyContent: "space-between",
  },
});
