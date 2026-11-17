import { useProfileShelves, useReaderShelves } from "@grimo/client";
import type { ShelfStyle } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { Bookcase } from "@/features/shelves";
import { useTheme } from "@/hooks/use-theme";

/** Covers in a preview: small, side by side on a plank. */
const COVER = 58;
const PREVIEW_BOOKS = 8;

interface PreviewBook {
  entryId: string;
  openLibraryId: string;
  title: string;
  coverUrl: string | null;
  pageCount?: number | null;
}

/**
 * The profile's Estantes tab: Lendo, Lidos and the shelves the reader made, each a preview of
 * the shelf (in its bookcase skin when enabled, else covers on a plank). Tapping opens the whole shelf.
 */
export function ProfileShelves({
  username,
  showBookcase = true,
}: {
  username: string;
  showBookcase?: boolean;
}) {
  const shelves = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  const [width, setWidth] = useState(0);
  if (!shelves) return null;
  const { reading, read } = shelves;
  const previews: {
    key: string;
    name: string;
    count: number;
    style: ShelfStyle;
    books: PreviewBook[];
  }[] = [
    ...(reading.count > 0
      ? [
          {
            key: "reading",
            name: "Lendo",
            count: reading.count,
            style: shelves.style,
            books: reading.items,
          },
        ]
      : []),
    ...(read.count > 0
      ? [
          {
            key: "read",
            name: "Lidos",
            count: read.count,
            style: shelves.style,
            books: read.runs.flatMap((run) => run.items),
          },
        ]
      : []),
    ...made.map((shelf) => ({
      key: shelf.id,
      name: shelf.isPublic ? shelf.name : `${shelf.name} · só você`,
      count: shelf.count,
      style: shelf.style,
      books: shelf.covers,
    })),
  ];
  if (previews.length === 0) {
    return <Text color="textMuted">Nenhum livro lido ou em leitura ainda.</Text>;
  }
  return (
    <View style={styles.root} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {previews.map((preview) => (
        <Preview
          key={preview.key}
          name={preview.name}
          count={preview.count}
          style={preview.style}
          books={preview.books.slice(0, PREVIEW_BOOKS)}
          showBookcase={showBookcase}
          width={width}
          onPress={() =>
            router.push({
              pathname: "/shelf/[username]/[shelf]",
              params: { username, shelf: preview.key },
            })
          }
        />
      ))}
    </View>
  );
}

function Preview({
  name,
  count,
  style,
  books,
  showBookcase,
  width,
  onPress,
}: {
  name: string;
  count: number;
  style: ShelfStyle;
  books: PreviewBook[];
  showBookcase: boolean;
  width: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Estante ${name}, ${count} livros. Abrir`}
      onPress={onPress}
      style={({ pressed }) => [styles.preview, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.between}>
        <Text variant="heading" numberOfLines={1} style={styles.grow}>
          {name}
        </Text>
        <View style={styles.link}>
          <Text variant="label" color="accentInk">
            {count} {count === 1 ? "livro" : "livros"}
          </Text>
          <Icon name="chevronRight" size={14} color="accentInk" />
        </View>
      </View>
      {books.length === 0 ? (
        <Text variant="small" color="textMuted">
          Nenhum livro nesta estante ainda.
        </Text>
      ) : showBookcase && width > 0 ? (
        <View style={styles.bookcaseWrap}>
          <Bookcase
            items={books.map((book) => ({
              entry: { id: book.entryId },
              book: {
                title: book.title,
                coverUrl: book.coverUrl,
                openLibraryId: book.openLibraryId,
                pageCount: book.pageCount,
              },
            }))}
            style={style}
            width={width}
            minHeight={0}
            top={0}
            bottom={0}
            name={name}
            onPress={(item) =>
              router.push({
                pathname: "/book/[id]",
                params: { id: item.book.openLibraryId },
              })
            }
          />
        </View>
      ) : (
        <View>
          <View style={styles.covers}>
            {books.map((book) => (
              <BookCover key={book.entryId} src={book.coverUrl} title={book.title} width={COVER} />
            ))}
          </View>
          <View style={[styles.plank, { backgroundColor: theme.edge }]} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[6] },
  preview: { gap: spacing[2] },
  between: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  link: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  grow: { flex: 1 },
  bookcaseWrap: { borderRadius: radius.lg, overflow: "hidden" },
  covers: { flexDirection: "row", gap: spacing[2], overflow: "hidden", paddingBottom: 2 },
  plank: { height: 8, borderRadius: radius.sm / 2 },
});
