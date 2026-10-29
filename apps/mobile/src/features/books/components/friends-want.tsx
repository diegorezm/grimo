import { friendsWantLabel } from "@grimo/core";
import { StyleSheet, View } from "react-native";
import { AvatarStack, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";

/** "Bia e Caio querem ler", with their faces: the people you follow who want this book. */
export function FriendsWant({
  friends,
}: {
  friends: { id: string; name: string; image: string | null }[];
}) {
  if (friends.length === 0) return null;
  return (
    <View style={styles.row}>
      <AvatarStack people={friends} />
      <Text variant="small" color="textMuted" style={styles.flex}>
        {friendsWantLabel(friends.map((friend) => friend.name))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  flex: { flexShrink: 1 },
});
