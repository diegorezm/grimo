import type { Profile } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Profile hero: avatar in an accent ring, name, bio, follow counts and favorite genres. */
export function ProfileHeader({ profile }: { profile: Profile }) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <View style={[styles.ring, { borderColor: theme.accent }]}>
        {profile.image ? (
          <Image source={profile.image} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initial, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="display">{profile.name.slice(0, 1)}</Text>
          </View>
        )}
      </View>
      <Text variant="display" style={styles.center}>
        {profile.name}
      </Text>
      {profile.username && (
        <Text variant="label" color="textMuted">
          @{profile.username}
        </Text>
      )}
      {profile.bio && (
        <Text color="textMuted" style={[styles.center, styles.bio]}>
          {profile.bio}
        </Text>
      )}
      <View style={[styles.counts, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
        <Count value={profile.followers} label="seguidores" />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Count value={profile.following} label="seguindo" />
      </View>
      {profile.favoriteGenres.length > 0 && (
        <Text variant="small" color="textMuted" style={styles.center}>
          {profile.favoriteGenres.map((g) => GENRE_LABELS[g as Genre] ?? g).join(" · ")}
        </Text>
      )}
    </View>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Text variant="number" style={styles.number}>
        {value}
      </Text>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: spacing[2] },
  ring: { borderWidth: 3, borderRadius: radius.full, padding: 3 },
  avatar: { width: 88, height: 88, borderRadius: radius.full },
  initial: { alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  bio: { fontStyle: "italic" },
  counts: {
    flexDirection: "row",
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  count: { flex: 1, alignItems: "center" },
  number: { fontSize: 22 },
  divider: { width: 1 },
});
