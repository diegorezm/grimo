import { useProfileShelves, useReaderShelves } from "@grimo/client";
import { yearRunLabel } from "@grimo/core";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

const COVER = 72;

interface ShelfCover {
  entryId: string;
  openLibraryId: string;
  title: string;
  coverUrl: string | null;
}

/**
 * A profile's shelves as rows of covers, spine to spine: Lendo, then Lidos in runs by the year
 * each book was finished ("Lidos '26", "Lidos '25").
 */
export function ProfileShelves({ username }: { username: string }) {
  const shelves = useReaderShelves(username).data;
  const saved = useProfileShelves(username).data?.items ?? [];
  if (!shelves) return null;
  const { reading, read } = shelves;
  if (reading.count === 0 && read.count === 0 && saved.length === 0) {
    return <Text color="textMuted">Nenhum livro lido ou em leitura ainda.</Text>;
  }
  return (
    <View style={styles.root}>
      {reading.count > 0 && (
        <Shelf title="Lendo" count={reading.count}>
          <Run label="Lendo agora" tone="accentStart" items={reading.items} />
        </Shelf>
      )}
      {read.count > 0 && (
        <Shelf title="Lidos" count={read.count}>
          {read.runs.map((run, index) => (
            <Run
              key={run.year ?? "sem-data"}
              label={yearRunLabel(run.year)}
              tone={index % 2 === 0 ? "accentStart" : "accent"}
              items={run.items}
            />
          ))}
        </Shelf>
      )}
      {saved.map((shelf) => (
        <Shelf
          key={shelf.id}
          title={shelf.isPublic ? shelf.name : `${shelf.name} · só você`}
          count={shelf.count}
        >
          {shelf.covers.length > 0 ? (
            <Run tone="accent" items={shelf.covers} />
          ) : (
            <Text variant="small" color="textMuted">
              Nenhum livro neste filtro ainda.
            </Text>
          )}
        </Shelf>
      ))}
    </View>
  );
}

function Shelf({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="heading">{title}</Text>
        <View style={[styles.count, { backgroundColor: theme.surfaceMuted }]}>
          <Text variant="small">
            {count} {count === 1 ? "livro" : "livros"}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {children}
      </ScrollView>
    </Card>
  );
}

/** One run of covers under its label, with a line in the label's color along the run. */
function Run({
  label,
  tone,
  items,
}: {
  label?: string;
  tone: "accent" | "accentStart";
  items: ShelfCover[];
}) {
  const theme = useTheme();
  const color = theme[tone];
  return (
    <View style={styles.run}>
      {label && (
        <>
          <View style={[styles.label, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="label" style={{ color: theme.text }}>
              {label}
            </Text>
          </View>
          <View style={[styles.line, { backgroundColor: color }]} />
        </>
      )}
      <View style={styles.covers}>
        {items.map((item) => (
          <Pressable
            key={item.entryId}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() =>
              router.push({ pathname: "/book/[id]", params: { id: item.openLibraryId } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <BookCover src={item.coverUrl} title={item.title} width={COVER} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  card: { paddingHorizontal: 0, gap: spacing[3] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
  },
  count: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: 2 },
  strip: { paddingHorizontal: spacing[4] },
  run: { gap: spacing[1], marginRight: 2 },
  label: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  line: { height: 2, borderRadius: 1 },
  covers: { flexDirection: "row", gap: 2, paddingTop: spacing[1] },
});
