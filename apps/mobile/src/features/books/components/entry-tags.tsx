import { toast, useMyShelves, useSetShelfBooks, useShelf } from "@grimo/client";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useShelfNaming } from "./shelf-naming";

/**
 * "Suas estantes" on a book page: the shelves you made, each a chip to put this book on it or
 * take it off, and "+ Nova estante" (with the book already on it).
 */
export function EntryTags({ entryId }: { entryId: string }) {
  const shelves = useMyShelves().data?.items ?? [];
  // The shelf list holds the entry's shelves and is patched at once when one is toggled.
  const on = new Set<string>(
    useShelf().data?.items.find((item) => item.entry.id === entryId)?.entry.tagIds ?? [],
  );
  const setBooks = useSetShelfBooks();
  const naming = useShelfNaming();

  function toggle(shelf: (typeof shelves)[number]) {
    const next = !on.has(shelf.id);
    setBooks.mutate(
      { shelfId: shelf.id, entryIds: [entryId], on: next },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(next ? `Na estante ${shelf.name}` : `Saiu da estante ${shelf.name}`);
  }

  return (
    <View style={styles.root}>
      <Text variant="label" color="textMuted">
        Suas estantes
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {shelves.map((shelf) => (
          <Chip
            key={shelf.id}
            label={shelf.name}
            active={on.has(shelf.id)}
            onPress={() => toggle(shelf)}
          />
        ))}
        <Chip label="+ Nova estante" onPress={() => naming.askNew([entryId])} />
      </ScrollView>
      {naming.dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  row: { gap: spacing[2], alignItems: "center" },
});
