import { useFriendsWant } from "@grimo/client";
import { friendsWantLabel } from "@grimo/core";
import { ScrollView, StyleSheet, View } from "react-native";
import { AvatarStack, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { BookTile } from "@/features/books";

const WIDTH = 96;

/** "Amigos querem ler": books the people you follow want, the most wanted first. */
export function FriendsWantRow() {
  const { data } = useFriendsWant();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant="heading">Amigos querem ler</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(({ book, friends, youWant }) => (
          <View key={book.id} style={[styles.item, { width: WIDTH }]}>
            <BookTile book={book} width={WIDTH} />
            <AvatarStack people={friends} size={20} />
            <Text variant="small" color="textMuted" numberOfLines={2}>
              {friendsWantLabel(friends.map((friend) => friend.name))}
            </Text>
            {youWant && (
              <Text variant="label" color="accent">
                Você também
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
