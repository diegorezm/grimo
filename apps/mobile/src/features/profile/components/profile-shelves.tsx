import { useProfileShelves, useReaderShelves } from "@grimo/client";
import { coverUrl, spineLook } from "@grimo/core";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Spines in a preview are drawn smaller than on the shelf screen. */
const SCALE = { width: 0.42, height: 0.26 };
const PREVIEW_BOOKS = 14;

interface PreviewBook {
  entryId: string;
  title: string;
  coverUrl: string | null;
}

/**
 * The profile's Estantes tab: Lendo, Lidos and the shelves the reader made, each a preview of
 * spines with its count. Tapping one opens the whole shelf.
 */
export function ProfileShelves({ username }: { username: string }) {
  const shelves = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  if (!shelves) return null;
  const { reading, read } = shelves;
  const previews = [
    ...(reading.count > 0
      ? [{ key: "reading", name: "Lendo", count: reading.count, books: reading.items }]
      : []),
    ...(read.count > 0
      ? [
          {
            key: "read",
            name: "Lidos",
            count: read.count,
            books: read.runs.flatMap((run) => run.items),
          },
        ]
      : []),
    ...made.map((shelf) => ({
      key: shelf.id,
      name: shelf.isPublic ? shelf.name : `${shelf.name} · só você`,
      count: shelf.count,
      books: shelf.covers,
    })),
  ];
  if (previews.length === 0) {
    return <Text color="textMuted">Nenhum livro lido ou em leitura ainda.</Text>;
  }
  return (
    <View style={styles.root}>
      {previews.map((preview) => (
        <Preview
          key={preview.key}
          name={preview.name}
          count={preview.count}
          books={preview.books.slice(0, PREVIEW_BOOKS)}
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
  books,
  onPress,
}: {
  name: string;
  count: number;
  books: PreviewBook[];
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
        <Text color="accent">
          {count} {count === 1 ? "livro" : "livros"} ›
        </Text>
      </View>
      {books.length === 0 ? (
        <Text variant="small" color="textMuted">
          Nenhum livro nesta estante ainda.
        </Text>
      ) : (
        <View>
          <View style={styles.spines}>
            {books.map((book) => {
              const look = spineLook(book.title, null);
              return (
                <View
                  key={book.entryId}
                  style={[
                    styles.spine,
                    {
                      width: Math.round(look.width * SCALE.width),
                      height: Math.round(look.height * SCALE.height),
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {book.coverUrl && (
                    <Image
                      source={coverUrl(book.coverUrl, "S")}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      contentPosition="left"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                </View>
              );
            })}
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
  between: { flexDirection: "row", alignItems: "baseline", gap: spacing[2] },
  grow: { flex: 1 },
  spines: { flexDirection: "row", alignItems: "flex-end", gap: 2, overflow: "hidden" },
  spine: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  plank: { height: 8, borderRadius: radius.sm / 2 },
});
