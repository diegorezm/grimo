import { type FeedTab, useFeed } from "@grimo/client";
import { groupActivities } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FeedItem } from "./feed-item";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "following", label: "Seguindo" },
  { id: "community", label: "Comunidade" },
];

/** The full feed: "Seguindo" (you + who you follow) and "Comunidade" (everyone on Grimo). */
export function FeedScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<FeedTab>("following");

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={styles.top}>
        <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
        <Text variant="display">Feed</Text>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(item.id)}
                style={[
                  styles.tab,
                  { borderColor: active ? theme.edge : "transparent" },
                  active && { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text variant="label" color={active ? "text" : "textMuted"}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {/* One list per tab, so each keeps its own page size. */}
      <FeedList key={tab} tab={tab} onShowCommunity={() => setTab("community")} />
    </SafeAreaView>
  );
}

function FeedList({ tab, onShowCommunity }: { tab: FeedTab; onShowCommunity: () => void }) {
  const feed = useFeed(tab);
  const groups = groupActivities(feed.data?.items ?? []);

  return (
    <FlatList
      data={groups}
      keyExtractor={(group) => group.id}
      renderItem={({ item: { items } }) => <FeedItem item={items[0]!} more={items.slice(1)} />}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        feed.isPending ? undefined : tab === "following" ? (
          <View style={styles.empty}>
            <Text color="textMuted">
              Ninguém por aqui ainda. Siga leitores para ver o que estão lendo.
            </Text>
            <Button variant="secondary" title="Ver a comunidade" onPress={onShowCommunity} />
          </View>
        ) : (
          <Text color="textMuted">
            Nada no Grimo ainda. Que tal começar marcando o que você está lendo?
          </Text>
        )
      }
      onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
      refreshControl={
        <RefreshControl refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: spacing[4], gap: spacing[3], paddingBottom: spacing[2] },
  tabs: { flexDirection: "row", gap: spacing[2] },
  tab: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
  },
  content: { padding: spacing[4], gap: spacing[3], paddingBottom: 120 },
  empty: { gap: spacing[3] },
});
