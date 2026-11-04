import { errorMessage, useCreateList, useList, useUpdateList } from "@grimo/client";
import { firstIssue, listSchema } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";

/** "Nova lista", or editing one when `id` is given. A new list opens right after. */
export function ListForm({ id }: { id?: string }) {
  const existing = useList(id ?? "").data;
  if (id && !existing) return null;
  return <Form id={id} initial={existing ?? null} />;
}

function Form({
  id,
  initial,
}: {
  id?: string;
  initial: { title: string; description: string } | null;
}) {
  const create = useCreateList();
  const update = useUpdateList();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const input = listSchema.safeParse({ title, description });
    if (!input.success) return setError(firstIssue(input.error));
    const onError = (failure: unknown) => setError(errorMessage(failure));
    if (id) {
      update.mutate({ id, ...input.data }, { onSuccess: () => router.back(), onError });
    } else {
      create.mutate(input.data, {
        onSuccess: ({ id: created }) =>
          router.replace({ pathname: "/list/[id]", params: { id: created } }),
        onError,
      });
    }
  }

  return (
    <View style={styles.root}>
      <Text variant="heading">{id ? "Editar lista" : "Nova lista"}</Text>
      <Input
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        placeholder="Nome (ex.: terror para começar)"
        accessibilityLabel="Nome da lista"
      />
      <Input
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        multiline
        placeholder="Do que se trata (opcional)"
        accessibilityLabel="Descrição da lista"
        style={styles.description}
      />
      {error && <Text color="danger">{error}</Text>}
      <Button
        title={id ? "Salvar" : "Criar lista"}
        onPress={save}
        disabled={create.isPending || update.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing[5], gap: spacing[4] },
  description: { minHeight: 80, textAlignVertical: "top" },
});
