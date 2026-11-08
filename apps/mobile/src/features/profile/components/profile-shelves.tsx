import { useProfileShelves, useReaderShelves } from "@grimo/client";
import { yearRunLabel } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, SelectButton, type SelectOption, SelectSheet, Text } from "@/components/ui";
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
 * A profile's shelves, one at a time in a selector (Lendo, Lidos, the shelves the reader made),
 * as a row of covers spine to spine; Lidos in runs by the year each book was finished.
 */
export function ProfileShelves({ username }: { username: string }) {
  const shelves = useReaderShelves(username).data;
  const made = useProfileShelves(username).data?.items ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  if (!shelves) return null;
  const { reading, read } = shelves;

  // One shelf at a time, picked in the selector: Lendo, Lidos, then the shelves the reader made.
  const options: SelectOption[] = [
    ...(reading.count > 0
      ? [{ value: READING, label: "Lendo", detail: String(reading.count) }]
      : []),
    ...(read.count > 0 ? [{ value: READ, label: "Lidos", detail: String(read.count) }] : []),
    ...made.map((shelf) => ({
      value: shelf.id,
      label: shelf.name,
      detail: String(shelf.count),
      hint: shelf.isPublic ? undefined : "só você vê",
    })),
  ];
  if (options.length === 0) {
    return <Text color="textMuted">Nenhum livro lido ou em leitura ainda.</Text>;
  }
  const value = options.some((option) => option.value === picked)
    ? picked!
    : (options.find((option) => option.value === READ)?.value ?? options[0]!.value);
  const current = options.find((option) => option.value === value)!;
  const shelf = made.find((item) => item.id === value);

  return (
    <View style={styles.root}>
      <SelectButton
        label={`${current.label} · ${current.detail}`}
        accessibilityLabel="Trocar de estante"
        onPress={() => setOpen(true)}
      />
      <SelectSheet
        visible={open}
        title="Estantes"
        options={options}
        value={value}
        onSelect={setPicked}
        onClose={() => setOpen(false)}
      />
      <Card style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {value === READING && (
            <Run label="Lendo agora" tone="accentStart" items={reading.items} />
          )}
          {value === READ &&
            read.runs.map((run, index) => (
              <Run
                key={run.year ?? "sem-data"}
                label={yearRunLabel(run.year)}
                tone={index % 2 === 0 ? "accentStart" : "accent"}
                items={run.items}
              />
            ))}
          {shelf &&
            (shelf.covers.length > 0 ? (
              <Run tone="accent" items={shelf.covers} />
            ) : (
              <Text variant="small" color="textMuted">
                Nenhum livro nesta estante ainda.
              </Text>
            ))}
        </ScrollView>
      </Card>
    </View>
  );
}

const READING = "reading";
const READ = "read";

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
  card: { paddingHorizontal: 0 },
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
