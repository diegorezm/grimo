import { readingPercent } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { ProgressBar, Stars, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookCover } from "./book-cover";

export interface BookTileData {
  openLibraryId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount?: number | null;
}

/**
 * A standing book (cover, title, author) that opens the book page.
 * Shows reading progress or the rating when the shelf entry has them.
 */
export function BookTile({
  book,
  currentPage,
  rating,
  width = 104,
}: {
  book: BookTileData;
  currentPage?: number;
  rating?: number | null;
  width?: number;
}) {
  const percent =
    currentPage !== undefined ? readingPercent(currentPage, book.pageCount ?? null) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.authors.join(", ")}`}
      onPress={() => router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })}
      style={({ pressed }) => [styles.root, { width, opacity: pressed ? 0.7 : 1 }]}
    >
      <BookCover src={book.coverUrl} title={book.title} width={width} />
      <View style={styles.info}>
        <Text variant="title" numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        <Text variant="small" color="accent" numberOfLines={1}>
          {book.authors.join(", ")}
        </Text>
        {percent !== null && (
          <View style={styles.progress}>
            <View style={styles.flex}>
              <ProgressBar percent={percent} height={4} />
            </View>
            <Text variant="label" color="textMuted">
              {percent}%
            </Text>
          </View>
        )}
        {rating ? <Stars value={rating} size={12} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  info: { gap: 2 },
  title: { fontSize: 15, lineHeight: 19 },
  progress: { flexDirection: "row", alignItems: "center", gap: spacing[1], marginTop: 2 },
  flex: { flex: 1 },
});
