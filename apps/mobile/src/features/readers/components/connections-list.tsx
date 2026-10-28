import { type ConnectionKind, useMe, useReaderConnections } from "@grimo/client";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReaderRow } from "./reader-row";

const TITLES: Record<ConnectionKind, string> = { followers: "Seguidores", following: "Seguindo" };

/** Who follows a reader, or whom they follow. Grows as you scroll. */
export function ConnectionsList({ username, kind }: { username: string; kind: ConnectionKind }) {
  const theme = useTheme();
  const me = useMe().data;
  const list = useReaderConnections(username, kind);
  const items = list.data?.items ?? [];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(reader) => reader.id}
        renderItem={({ item }) => <ReaderRow reader={item} meId={me?.id} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
            <Text variant="display">{TITLES[kind]}</Text>
            <Text variant="label" color="textMuted">
              @{username}
            </Text>
          </View>
        }
        ListEmptyComponent={
          list.isPending ? (
            <ActivityIndicator color={theme.accent} />
          ) : list.isError ? (
            <Text color="textMuted">Não conseguimos carregar essa lista.</Text>
          ) : (
            <Text color="textMuted">
              {kind === "followers" ? "Ninguém segue ainda." : "Ainda não segue ninguém."}
            </Text>
          )
        }
        ListFooterComponent={
          list.isFetchingNextPage ? <ActivityIndicator color={theme.accent} /> : undefined
        }
        onEndReached={() => list.hasNextPage && list.fetchNextPage()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: 120 },
  header: { alignItems: "flex-start", gap: spacing[1] },
});
