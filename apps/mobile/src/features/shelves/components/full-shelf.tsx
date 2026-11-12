import { useProfileShelf } from "@grimo/client";
import { SHELF_VIEW_LABELS, SHELF_VIEWS, yearRunLabel } from "@grimo/core";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, Chip, Screen, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFirstVisit } from "@/lib/motion";
import { useShelfViewStore } from "@/lib/shelf-view";
import { Bookcase } from "../bookcase/bookcase";
import { ShelfBooks } from "./shelf-books";

/**
 * One whole shelf of a reader, opened from their profile: their bookcase, the way they dressed
 * it (model, colors, objects…). Lidos is in runs by the year each book was finished, as spines
 * or covers.
 */
export function FullShelf({ username, shelf }: { username: string; shelf: string }) {
  const theme = useTheme();
  const firstVisit = useFirstVisit(`shelf-${username}-${shelf}`);
  const query = useProfileShelf(username, shelf);
  const { view, setView } = useShelfViewStore();
  const data = query.data;
  const { width } = useWindowDimensions();
  const byYear = shelf === "read";
  const open = (openLibraryId: string) =>
    router.push({ pathname: "/book/[id]", params: { id: openLibraryId } });

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
          {!byYear && data.runs[0] && (
            <View style={styles.bookcase}>
              <Bookcase
                items={data.runs[0].items}
                style={data.style}
                width={width - spacing[5] * 2}
                minHeight={0}
                top={24}
                bottom={0}
                name={data.name}
                animate={firstVisit}
                onPress={({ book }) => open(book.openLibraryId)}
              />
            </View>
          )}
          {byYear && (
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
          )}
          {data.count === 0 && <Text color="textMuted">Nenhum livro nesta estante ainda.</Text>}
          {byYear &&
            data.runs.map((run) => (
              <View key={run.year ?? "all"} style={styles.run}>
                {shelf === "read" && (
                  <View style={[styles.label, { backgroundColor: theme.surfaceMuted }]}>
                    <Text variant="label">{yearRunLabel(run.year)}</Text>
                  </View>
                )}
                <ShelfBooks
                  animate={firstVisit}
                  items={run.items}
                  view={view}
                  selecting={false}
                  selected={[]}
                  onPress={({ book }) => open(book.openLibraryId)}
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
  bookcase: { borderRadius: radius.lg, overflow: "hidden" },
  run: { gap: spacing[3] },
  label: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
});
