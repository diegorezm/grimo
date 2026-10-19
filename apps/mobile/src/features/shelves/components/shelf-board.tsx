import { useShelf, useShelfTabStore } from "@grimo/client";
import { SHELF_LABELS, SHELF_STATUSES } from "@grimo/core";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { radius, shelfBadges, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export function ShelfBoard() {
  const theme = useTheme();
  const badges = shelfBadges[useColorScheme() === "dark" ? "dark" : "light"];
  const { status, setStatus } = useShelfTabStore();
  const shelf = useShelf(status);

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {SHELF_STATUSES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={[
              styles.tab,
              {
                backgroundColor: badges[s].bg,
                borderColor: s === status ? badges[s].fg : badges[s].border,
                opacity: s === status ? 1 : 0.8,
              },
            ]}
          >
            <Text variant="label" style={{ color: badges[s].fg }}>
              {SHELF_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {shelf.isPending && <ActivityIndicator color={theme.primary} />}
      {shelf.data?.items.length === 0 && <Text color="textMuted">Nenhum livro aqui ainda.</Text>}
      {shelf.data?.items.map(({ entry, book }) => (
        <Card key={entry.id} style={styles.row}>
          <BookCover src={book.coverUrl} title={book.title} />
          <View style={styles.info}>
            <Text variant="title" numberOfLines={1}>
              {book.title}
            </Text>
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {book.authors.join(", ")}
            </Text>
            {entry.status === "reading" && book.pageCount ? (
              <Text variant="small" color="textMuted">
                Página {entry.currentPage} de {book.pageCount}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  tabs: { gap: spacing[1] },
  tab: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  row: { flexDirection: "row" },
  info: { flex: 1, gap: spacing[1] },
});
