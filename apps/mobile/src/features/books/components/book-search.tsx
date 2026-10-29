import { useBookSearch, useShelf } from "@grimo/client";
import { SHELF_LABELS } from "@grimo/core";
import { useDeferredValue, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { Button, Glass, Text } from "@/components/ui";
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
      <Glass style={styles.field}>
        <Text color="textMuted" style={styles.icon}>
          ⌕
        </Text>
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
      </Glass>

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
                <View
                  style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}
                >
                  <Text variant="label" style={{ color: badge.fg, fontSize: 9 }}>
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
  },
  icon: { fontSize: 20 },
  input: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing[3] },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
    justifyContent: "space-between",
  },
  cell: { width: 100 },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
