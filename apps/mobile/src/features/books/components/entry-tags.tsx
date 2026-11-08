import { toast, useSetTag, useShelf, useShelfTags } from "@grimo/client";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { NewTag } from "./new-tag";

/**
 * "Marcadores" on a book page: your tags for this book ("Tenho", "Kindle"), toggled with a tap.
 * They are what the shelf's tag filters and saved shelves look at.
 */
export function EntryTags({ entryId }: { entryId: string }) {
  const tags = useShelfTags().data?.items ?? [];
  // The shelf holds the entry's tags and is patched at once when one is toggled.
  const tagIds = useShelf().data?.items.find((item) => item.entry.id === entryId)?.entry.tagIds;
  const setTag = useSetTag();
  const on = new Set<string>(tagIds ?? []);

  function toggle(tag: (typeof tags)[number]) {
    const next = !on.has(tag.id);
    setTag.mutate(
      { tagId: tag.id, entryIds: [entryId], on: next },
      { onError: (error) => toast.failed(error) },
    );
    toast.saved(next ? `Marcado com ${tag.name}` : `${tag.name} saiu deste livro`);
  }

  return (
    <View style={styles.root}>
      <Text variant="label" color="textMuted">
        Seus marcadores
      </Text>
      {tags.length === 0 && (
        <Text variant="small" color="textMuted">
          Crie marcadores como “Tenho” ou “Kindle” para montar estantes com filtros.
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {tags.map((tag) => (
          <Chip key={tag.id} label={tag.name} active={on.has(tag.id)} onPress={() => toggle(tag)} />
        ))}
        <NewTag />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  row: { gap: spacing[2], alignItems: "center" },
});
