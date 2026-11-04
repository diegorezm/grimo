import { useTrending } from "@grimo/client";
import { namesLabel, SHELF_LABELS } from "@grimo/core";
import { ScrollView, StyleSheet, View } from "react-native";
import { AvatarStack, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";

const WIDTH = 96;

/** "Em alta entre quem você segue": what friends started, read and finished this month. */
export function TrendingRow() {
  const { data } = useTrending();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant="heading">Em alta entre quem você segue</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(({ book, friends, viewerStatus }) => (
          <View key={book.id} style={[styles.item, { width: WIDTH }]}>
            <BookTile book={book} width={WIDTH} />
            <AvatarStack people={friends} size={20} />
            <Text variant="small" color="textMuted" numberOfLines={2}>
              {namesLabel(friends.map((friend) => friend.name))}
            </Text>
            {viewerStatus && (
              <Text variant="label" color="accent">
                {SHELF_LABELS[viewerStatus]}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  row: { gap: spacing[4] },
  item: { gap: spacing[1] },
});
