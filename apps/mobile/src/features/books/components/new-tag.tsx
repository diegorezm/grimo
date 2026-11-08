import { toast, useCreateTag } from "@grimo/client";
import { firstIssue, tagNameSchema } from "@grimo/core";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Chip, Input } from "@/components/ui";
import { spacing } from "@/constants/theme";

/** "+ Marcador": names a new tag inline. */
export function NewTag() {
  const createTag = useCreateTag();
  const [name, setName] = useState<string | null>(null);
  if (name === null) return <Chip label="+ Marcador" onPress={() => setName("")} />;
  function create() {
    const parsed = tagNameSchema.safeParse(name);
    if (!parsed.success) return toast.info(firstIssue(parsed.error));
    createTag.mutate(parsed.data, {
      onSuccess: () => {
        toast.saved(`Marcador ${parsed.data} criado. Use “Selecionar” para marcar livros.`);
        setName(null);
      },
      onError: (error) => toast.failed(error),
    });
  }
  return (
    <View style={styles.newTag}>
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Tenho, Kindle…"
        maxLength={30}
        autoFocus
        onSubmitEditing={create}
        returnKeyType="done"
        style={styles.newTagInput}
      />
      <Chip label="Criar" active onPress={create} />
      <Chip label="✕" onPress={() => setName(null)} accessibilityLabel="Cancelar" />
    </View>
  );
}

const styles = StyleSheet.create({
  newTag: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  newTagInput: { width: 150, minHeight: 36, paddingVertical: 6 },
});
