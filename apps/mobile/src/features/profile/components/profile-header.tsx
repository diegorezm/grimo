import type { Profile } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function ProfileHeader({ profile }: { profile: Profile }) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Image
          source={profile.image}
          style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}
        />
        <View>
          <Text variant="heading">{profile.name}</Text>
          {profile.username && <Text color="textMuted">@{profile.username}</Text>}
        </View>
      </View>
      {profile.bio && <Text>{profile.bio}</Text>}
      <Text variant="small" color="textMuted">
        {profile.followers} seguidores · {profile.following} seguindo
        {profile.favoriteGenres.length > 0 &&
          ` · ${profile.favoriteGenres.map((g) => GENRE_LABELS[g as Genre] ?? g).join(", ")}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  avatar: { width: 64, height: 64, borderRadius: radius.full },
});
