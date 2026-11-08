import { useProfileShelf } from "@grimo/client";
import { SHELF_VIEW_LABELS, SHELF_VIEWS, yearRunLabel } from "@grimo/core";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Chip, Screen, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useShelfViewStore } from "@/lib/shelf-view";
import { ShelfBooks } from "./shelf-books";

/**
 * One whole shelf of a reader, opened from their profile: every book, as spines or covers (the
 * same choice as your own shelf), Lidos in runs by the year each book was finished.
 */
export function FullShelf({ username, shelf }: { username: string; shelf: string }) {
  const theme = useTheme();
  const query = useProfileShelf(username, shelf);
  const { view, setView } = useShelfViewStore();
  const data = query.data;

  return (
    <Screen>
      <View style={styles.top}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
        {data && (
          <Text variant="small" color="textMuted">
            Estante de @{data.owner.username}
          </Text>
        )}
      </View>
      {query.isError && <Text color="textMuted">Essa estante não está disponível.</Text>}
      {!data && !query.isError && <ActivityIndicator color={theme.accent} />}
      {data && (
        <>
          <View style={styles.title}>
            <Text variant="display">{data.name}</Text>
            <Text variant="small" color="textMuted">
              {data.count} {data.count === 1 ? "livro" : "livros"}
              {data.isPublic ? "" : " · só você vê"}
            </Text>
          </View>
          <View style={styles.views}>
            {SHELF_VIEWS.map((option) => (
              <Chip
                key={option}
                label={SHELF_VIEW_LABELS[option]}
                active={view === option}
                onPress={() => setView(option)}
              />
            ))}
          </View>
          {data.count === 0 && <Text color="textMuted">Nenhum livro nesta estante ainda.</Text>}
          {data.runs.map((run) => (
            <View key={run.year ?? "all"} style={styles.run}>
              {shelf === "read" && (
                <View style={[styles.label, { backgroundColor: theme.surfaceMuted }]}>
                  <Text variant="label">{yearRunLabel(run.year)}</Text>
                </View>
              )}
              <ShelfBooks
                items={run.items}
                view={view}
                selecting={false}
                selected={[]}
                onPress={({ book }) =>
                  router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
                }
              />
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { gap: 2 },
  views: { flexDirection: "row", gap: spacing[2] },
  run: { gap: spacing[3] },
  label: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
});
