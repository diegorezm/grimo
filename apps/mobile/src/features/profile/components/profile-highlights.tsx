import type { ReaderPage } from "@grimo/client";
import { editionPages, readingPercent } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, ProgressBar, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";

/**
 * The reading cards under the header, each one the reader can hide (`profileShows`): what they
 * are reading now, the year's goal and the streak (only known on your own profile).
 */
export function ProfileHighlights({
  page,
  streak,
}: {
  page: ReaderPage;
  /** Days in a row; your own profile only (the streak query is private). */
  streak?: number | null;
}) {
  const { profile, books, stats } = page;
  const shows = profile.profileShows;
  const reading = shows.reading ? books.reading[0] : undefined;
  const goal = shows.goal ? stats.goal : null;
  const showStreak = shows.streak && streak !== undefined && streak !== null && streak > 0;
  if (!reading && !goal && !showStreak) return null;

  return (
    <View style={styles.root}>
      {reading && <ReadingNow item={reading} more={books.reading.length - 1} />}
      {(goal || showStreak) && (
        <Card>
          {goal && (
            <>
              <View style={styles.between}>
                <Text variant="label" color="textMuted">
                  Meta de {stats.year}
                </Text>
                <Text variant="number">
                  {goal.done} / {goal.target}
                </Text>
              </View>
              <ProgressBar percent={Math.min(100, Math.round((goal.done / goal.target) * 100))} />
            </>
          )}
          <Text variant="small" color="textMuted">
            {[
              goal &&
                (goal.done >= goal.target
                  ? "Meta batida."
                  : `Faltam ${goal.target - goal.done} livros.`),
              showStreak && `Ofensiva de ${streak} ${streak === 1 ? "dia" : "dias"} lendo.`,
            ]
              .filter(Boolean)
              .join(" ")}
          </Text>
        </Card>
      )}
    </View>
  );
}

function ReadingNow({
  item,
  more,
}: {
  item: ReaderPage["books"]["reading"][number];
  more: number;
}) {
  const { entry, book } = item;
  const pages = editionPages(entry.pageCount, book.pageCount ?? null);
  const percent = readingPercent(entry.currentPage, pages);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })}
    >
      <Card>
        <Text variant="label" color="textMuted">
          Lendo agora{more > 0 ? ` · e mais ${more}` : ""}
        </Text>
        <View style={styles.reading}>
          <BookCover src={book.coverUrl} title={book.title} width={48} />
          <View style={styles.grow}>
            <Text variant="heading" numberOfLines={2}>
              {book.title}
            </Text>
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {book.authors.join(", ")} · pág. {entry.currentPage}
              {pages ? ` de ${pages}` : ""}
            </Text>
            {percent !== null && <ProgressBar percent={percent} />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  between: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  reading: { flexDirection: "row", gap: spacing[3], alignItems: "center" },
  grow: { flex: 1, gap: spacing[1] },
});
