import { toast, useSetTag, useShelfFilterStore, useShelfTags } from "@grimo/client";
import { MAX_BULK_TAG } from "@grimo/core";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Select mode: put a tag on (or take it off) the picked books at once. */
export function ShelfSelectBar() {
  const theme = useTheme();
  const tags = useShelfTags().data?.items ?? [];
  const setTag = useSetTag();
  const { selected, setSelecting } = useShelfFilterStore();

  function choose(on: boolean) {
    if (selected.length === 0) return toast.info("Toque nos livros para selecionar.");
    if (selected.length > MAX_BULK_TAG) {
      return toast.info(`Selecione até ${MAX_BULK_TAG} livros de uma vez.`);
    }
    if (tags.length === 0) return toast.info("Crie um marcador nos filtros primeiro.");
    Alert.alert(on ? "Marcar com…" : "Tirar o marcador…", `${selected.length} livros`, [
      ...tags.map((tag) => ({
        text: tag.name,
        onPress: () => {
          const entryIds = [...selected];
          setTag.mutate(
            { tagId: tag.id, entryIds, on },
            { onError: (error) => toast.failed(error) },
          );
          toast.saved(
            on
              ? `${entryIds.length} ${entryIds.length === 1 ? "livro marcado" : "livros marcados"} com ${tag.name}`
              : `${tag.name} saiu de ${entryIds.length} ${entryIds.length === 1 ? "livro" : "livros"}`,
          );
          setSelecting(false);
        },
      })),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <Text variant="label">
        {selected.length} {selected.length === 1 ? "selecionado" : "selecionados"}
      </Text>
      <View style={styles.actions}>
        <Button variant="ghost" title="Tirar" onPress={() => choose(false)} />
        <Button title="Marcar com…" onPress={() => choose(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", gap: spacing[2] },
});
