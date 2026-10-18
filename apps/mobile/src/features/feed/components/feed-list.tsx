import { useFeed } from "@grimo/client";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { FeedItem } from "./feed-item";

export function FeedList() {
  const feed = useFeed();
  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedItem item={item} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Text variant="heading">Feed</Text>}
      ListEmptyComponent={
        feed.isPending ? undefined : (
          <Text color="textMuted">
            Seu feed está vazio. Adicione livros às estantes ou siga outros leitores.
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

const styles = StyleSheet.create({ content: { padding: spacing[4], gap: spacing[3] } });
