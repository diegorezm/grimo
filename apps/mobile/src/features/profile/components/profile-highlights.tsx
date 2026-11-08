import type { ReaderPage } from "@grimo/client";
import { editionPages, GENRE_LABELS, type Genre, readingPercent } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

/** "Lendo agora", under the header (unless the reader hides it). */
export function ProfileReadingNow({ page }: { page: ReaderPage }) {
  const { profile, books } = page;
  const item = profile.profileShows.reading ? books.reading[0] : undefined;
  if (!item) return null;
  const { entry, book } = item;
  const more = books.reading.length - 1;
  const pages = editionPages(entry.pageCount, book.pageCount ?? null);
  const percent = readingPercent(entry.currentPage, pages);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })}
    >
      <View style={styles.reading}>
        <BookCover src={book.coverUrl} title={book.title} width={48} />
        <View style={styles.grow}>
          <Text variant="label" color="textMuted">
            Lendo agora{more > 0 ? ` · e mais ${more}` : ""}
          </Text>
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
    </Pressable>
  );
}

/**
 * The "Destaques" tab: the four "livros de cabeceira", the year's goal and the streak (each
 * one the reader can hide), and the favorite genres. The quote is at the top of the profile.
 */
export function ProfileFeatured({
  page,
  streak,
}: {
  page: ReaderPage;
  /** Days in a row; your own profile only (the streak query is private). */
  streak?: number | null;
}) {
  const theme = useTheme();
  const { profile, stats } = page;
  const goal = profile.profileShows.goal ? stats.goal : null;
  const showStreak = profile.profileShows.streak && !!streak && streak > 0;
  const empty =
    profile.favoriteBooks.length === 0 &&
    !goal &&
    !showStreak &&
    profile.favoriteGenres.length === 0;
  if (empty) return <Text color="textMuted">Nada em destaque ainda.</Text>;

  return (
    <View style={styles.root}>
      {profile.favoriteBooks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.between}>
            <Text variant="heading">Livros de cabeceira</Text>
            <Text variant="small" color="textMuted">
              os favoritos
            </Text>
          </View>
          <View style={styles.favorites}>
            {profile.favoriteBooks.map((book) => (
              <Pressable
                key={book.id}
                accessibilityRole="button"
                accessibilityLabel={book.title}
                onPress={() =>
                  router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
                }
                style={({ pressed }) => [styles.favorite, { opacity: pressed ? 0.7 : 1 }]}
              >
                <BookCover src={book.coverUrl} title={book.title} width={78} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

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

      {profile.favoriteGenres.length > 0 && (
        <View style={styles.section}>
          <Text variant="heading">Gêneros favoritos</Text>
          <View style={styles.chips}>
            {profile.favoriteGenres.map((genre) => (
              <View key={genre} style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
                <Text variant="small">{GENRE_LABELS[genre as Genre] ?? genre}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  section: { gap: spacing[3] },
  between: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  reading: { flexDirection: "row", gap: spacing[3], alignItems: "center" },
  grow: { flex: 1, gap: spacing[1] },
  favorites: { flexDirection: "row", gap: spacing[2] },
  favorite: { flex: 1, alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
});
