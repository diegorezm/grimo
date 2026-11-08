import { useBookSearch, useShelf } from "@grimo/client";
import { SHELF_LABELS } from "@grimo/core";
import { useDeferredValue, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { Button, Icon, Text } from "@/components/ui";
import { fontSize, radius, shelfBadges, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { BookTile } from "./book-tile";
import { ManualBookForm } from "./manual-book-form";

/** Search as you type; results open the book page, where you pick a shelf. */
export function BookSearch() {
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const [query, setQuery] = useState("");
  const search = useBookSearch(useDeferredValue(query));
  const shelf = useShelf();
  const statusById = useMemo(
    () => new Map(shelf.data?.items.map(({ entry, book }) => [book.openLibraryId, entry.status])),
    [shelf.data],
  );
  const items = search.data?.items ?? [];
  const [adding, setAdding] = useState(false);
  const searched = query.trim().length >= 2 && !search.isFetching;

  return (
    <View style={styles.root}>
      <View
        style={[styles.field, { borderColor: theme.border, backgroundColor: theme.background }]}
      >
        <Icon name="search" size={20} color="textMuted" />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Título, autor ou ISBN"
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          accessibilityLabel="Buscar livros"
          style={[styles.input, { color: theme.text }]}
        />
        {search.isFetching && <ActivityIndicator color={theme.accent} />}
      </View>

      {searched && items.length === 0 && (
        <Text color="textMuted">Nenhum livro encontrado. Tente o autor ou o ISBN.</Text>
      )}
      {query.trim().length < 2 && (
        <Text color="textMuted">Busque pelo título, autor ou ISBN para adicionar à estante.</Text>
      )}

      <View style={styles.grid}>
        {items.map((book) => {
          const status = statusById.get(book.openLibraryId);
          const badge = status ? shelfBadges[scheme][status] : null;
          return (
            <View key={book.openLibraryId} style={styles.cell}>
              <BookTile book={book} width={100} />
              {status && badge && (
                <View style={styles.status}>
                  <View style={[styles.dot, { backgroundColor: badge.fg }]} />
                  <Text variant="small" style={styles.statusText}>
                    {SHELF_LABELS[status]}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {searched &&
        (adding ? (
          <ManualBookForm initialTitle={query.trim()} onCancel={() => setAdding(false)} />
        ) : (
          <Button
            variant="ghost"
            title="Não achou? Cadastre o livro"
            onPress={() => setAdding(true)}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing[3] },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing[5],
    justifyContent: "space-between",
  },
  cell: { width: 100, gap: spacing[1] },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  statusText: { fontSize: 12 },
});
