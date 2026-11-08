import { toast, useShelf, useShelfFilterStore, useShelfTags } from "@grimo/client";
import { isFilterEmpty, matchesShelfFilter } from "@grimo/core";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";
import { ShelfFilterBar } from "./shelf-filter-bar";
import { ShelfSelectBar } from "./shelf-select-bar";

const TILE = 100;

/**
 * One shelf, many views: every book you have, filtered by status, genre and your tags ("Tenho",
 * "Kindle"), with saved filters as named shelves. "Selecionar" picks books to tag at once.
 */
export function ShelfBoard() {
  const theme = useTheme();
  const shelf = useShelf();
  const tags = useShelfTags().data?.items ?? [];
  const { filter, selecting, selected, setSelecting, toggleSelected, selectAll } =
    useShelfFilterStore();
  const all = shelf.data?.items ?? [];
  const items = all.filter((row) => matchesShelfFilter(row, filter));
  const tagName = new Map<string, string>(tags.map((tag) => [tag.id, tag.name]));

  return (
    <View style={styles.root}>
      <ShelfFilterBar rows={all} />

      <View style={styles.between}>
        <Text variant="label" color="textMuted">
          {items.length} {items.length === 1 ? "livro" : "livros"}
          {isFilterEmpty(filter) ? "" : " neste filtro"}
        </Text>
        {items.length > 0 && (
          <Button
            variant="ghost"
            title={selecting ? "Cancelar" : "Selecionar"}
            onPress={() => {
              if (!selecting && tags.length === 0) {
                toast.info("Crie um marcador (como “Tenho”) nos filtros para marcar livros.");
              }
              setSelecting(!selecting);
            }}
          />
        )}
      </View>
      {selecting && (
        <Button
          variant="secondary"
          title={selected.length === items.length ? "Desmarcar todos" : "Selecionar todos"}
          onPress={() =>
            selectAll(selected.length === items.length ? [] : items.map((row) => row.entry.id))
          }
        />
      )}

      {shelf.isPending && <ActivityIndicator color={theme.accent} />}
      {!shelf.isPending && all.length === 0 && (
        <Text color="textMuted">Nenhum livro aqui ainda. Use a busca para adicionar.</Text>
      )}
      {!shelf.isPending && all.length > 0 && items.length === 0 && (
        <Text color="textMuted">Nenhum livro neste filtro.</Text>
      )}

      <View style={styles.grid}>
        {items.map(({ entry, book }) => {
          const picked = selected.includes(entry.id);
          const labels = entry.tagIds.flatMap((id) => tagName.get(id) ?? []);
          return (
            <Pressable
              key={entry.id}
              accessibilityRole={selecting ? "checkbox" : "button"}
              accessibilityState={selecting ? { checked: picked } : undefined}
              accessibilityLabel={book.title}
              onPress={() =>
                selecting
                  ? toggleSelected(entry.id)
                  : router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
              }
              style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View>
                <BookCover src={book.coverUrl} title={book.title} width={TILE} />
                {selecting && (
                  <View
                    style={[
                      styles.check,
                      {
                        backgroundColor: picked ? theme.accent : theme.glass,
                        borderColor: picked ? theme.accent : theme.glassBorder,
                      },
                    ]}
                  >
                    {picked && (
                      <Text variant="label" color="accentForeground">
                        ✓
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <Text variant="small" numberOfLines={2}>
                {book.title}
              </Text>
              {labels.length > 0 && (
                <Text variant="small" color="textMuted" numberOfLines={1}>
                  {labels.join(" · ")}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {selecting && <ShelfSelectBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
    justifyContent: "space-between",
  },
  tile: { width: TILE, gap: spacing[1] },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
