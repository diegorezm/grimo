import { useAddToShelf, useBookSearch } from "@grimo/client";
import { SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import { useDeferredValue, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Input, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { BookCover } from "./book-cover";

export function BookSearch() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const search = useBookSearch(useDeferredValue(query));
  const addToShelf = useAddToShelf();

  return (
    <View style={styles.root}>
      <Input
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder="Título, autor ou ISBN"
        returnKeyType="search"
      />
      {search.isFetching && <ActivityIndicator color={theme.primary} />}
      {search.data?.items.map((book) => (
        <View key={book.openLibraryId} style={styles.row}>
          <BookCover src={book.coverUrl} title={book.title} />
          <View style={styles.info}>
            <Text variant="title" numberOfLines={1}>
              {book.title}
            </Text>
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {book.authors.join(", ")}
            </Text>
            <View style={styles.chips}>
              {SHELF_STATUSES.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => addToShelf.mutate({ book, status })}
                  style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}
                >
                  <Text variant="small">{SHELF_LABELS[status]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  row: { flexDirection: "row", gap: spacing[3] },
  info: { flex: 1, gap: spacing[1] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 2 },
});
