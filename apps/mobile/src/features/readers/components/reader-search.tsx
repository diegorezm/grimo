import { useMe, useReaderSearch, useReaderSuggestions } from "@grimo/client";
import { useDeferredValue, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { Button, Glass, Text } from "@/components/ui";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReaderRow } from "./reader-row";

/** Find readers by name or @; with nothing typed, who you might want to follow. */
export function ReaderSearch() {
  const theme = useTheme();
  const me = useMe().data;
  const [query, setQuery] = useState("");
  const text = useDeferredValue(query).trim();
  const search = useReaderSearch(text);
  const suggestions = useReaderSuggestions();
  const list = text ? search : suggestions;
  const items = list.data?.items ?? [];

  return (
    <View style={styles.root}>
      <Glass style={styles.field}>
        <Text color="textMuted" style={styles.icon}>
          @
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nome ou @ do leitor"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar leitores"
          style={[styles.input, { color: theme.text }]}
        />
        {text !== "" && search.isFetching && <ActivityIndicator color={theme.accent} />}
      </Glass>

      <Text variant="label" color="textMuted">
        {text ? "Leitores" : "Sugestões para seguir"}
      </Text>
      {list.isPending && list.fetchStatus !== "idle" ? (
        <ActivityIndicator color={theme.accent} />
      ) : items.length === 0 ? (
        <Text color="textMuted">
          {text
            ? "Ninguém com esse nome ou @."
            : "Sem sugestões por agora. Busque pelo nome de quem você conhece."}
        </Text>
      ) : (
        items.map((reader) => <ReaderRow key={reader.id} reader={reader} meId={me?.id} />)
      )}
      {list.hasNextPage && (
        <Button
          variant="secondary"
          title={list.isFetchingNextPage ? "Carregando…" : "Ver mais"}
          onPress={list.fetchNextPage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    minHeight: 52,
    borderRadius: radius.full,
  },
  icon: { fontSize: 18 },
  input: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing[3] },
});
