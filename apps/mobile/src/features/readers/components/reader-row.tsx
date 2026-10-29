import type { ReaderCard } from "@grimo/client";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { FollowButton } from "./follow-button";

/** A reader in a list (search, suggestions, followers): tap to open the profile. */
export function ReaderRow({
  reader,
  meId,
}: {
  reader: Omit<ReaderCard, "since"> & { mutualName?: string | null };
  meId?: string;
}) {
  const context = reader.mutualName
    ? `Seguido por ${reader.mutualName}`
    : reader.readingNow
      ? `Lendo ${reader.readingNow}`
      : `${reader.bookCount} ${reader.bookCount === 1 ? "livro" : "livros"}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Perfil de ${reader.name}`}
      onPress={() =>
        router.push({ pathname: "/u/[username]", params: { username: reader.username } })
      }
      style={({ pressed }) => [styles.root, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Avatar image={reader.image} name={reader.name} size={44} />
      <View style={styles.text}>
        <Text variant="title" numberOfLines={1}>
          {reader.name}
        </Text>
        <Text variant="label" color="textMuted" numberOfLines={1}>
          @{reader.username}
          {reader.role === "admin" ? " · admin" : reader.role === "moderator" ? " · moderador" : ""}
          {reader.followsYou ? " · segue você" : ""}
        </Text>
        <Text variant="small" color="textMuted" numberOfLines={1}>
          {context}
        </Text>
      </View>
      {reader.id !== meId && (
        <FollowButton
          userId={reader.id}
          isFollowing={reader.isFollowing}
          followsYou={reader.followsYou}
          compact
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  text: { flex: 1, gap: 2 },
});
