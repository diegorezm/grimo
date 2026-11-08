import { type ConnectionKind, type Profile, useReaderShelves } from "@grimo/client";
import { compactCount } from "@grimo/core";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { profileCovers, radius, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { AvatarPicker } from "./avatar-picker";
import { SongCard } from "./song-card";

/**
 * Profile hero: the cover in the reader's color, photo, name, @ and pronouns, bio, the counts
 * (lidos, páginas, seguidores, seguindo) and the "trilha da leitura". The rest of the profile
 * lives in its tabs (Estantes, Destaques…).
 * `editable`: your own profile (tapping the photo changes it). `actions`: the button beside the
 * photo (Editar perfil, Seguir). `corner`: top-right buttons on the cover (ajustes, ⋯).
 */
export function ProfileHeader({
  profile,
  editable,
  onPressCount,
  actions,
  corner,
}: {
  profile: Profile;
  editable?: boolean;
  onPressCount?: (kind: ConnectionKind) => void;
  actions?: ReactNode;
  corner?: ReactNode;
}) {
  const theme = useTheme();
  // Same query as the Estantes tab (cached once): books read and their pages.
  const shelves = useReaderShelves(profile.username).data;
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const cover = profileCovers[scheme][profile.profileColor];
  const role =
    profile.role === "admin" ? "ADMIN" : profile.role === "moderator" ? "MODERADOR" : null;
  const handle = [profile.username && `@${profile.username}`, profile.pronouns, role]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.root}>
      <View style={[styles.cover, { backgroundColor: cover.bg }]}>
        <View style={styles.corner}>{corner}</View>
      </View>
      <View style={styles.body}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatarRing, { borderColor: theme.background }]}>
            {editable ? (
              <AvatarPicker image={profile.image} name={profile.name} />
            ) : profile.image ? (
              <Image source={profile.image} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initial, { backgroundColor: theme.glowA }]}>
                <Text variant="display">{profile.name.slice(0, 1)}</Text>
              </View>
            )}
          </View>
          <View style={styles.actions}>{actions}</View>
        </View>

        <View style={styles.names}>
          <Text variant="display">{profile.name}</Text>
          {handle !== "" && (
            <Text variant="label" color="textMuted">
              {handle}
            </Text>
          )}
        </View>
        {profile.bio && <Text>{profile.bio}</Text>}

        <View style={[styles.counts, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
          <Count
            value={shelves ? compactCount(shelves.read.count) : "–"}
            label={shelves?.read.count === 1 ? "lido" : "lidos"}
          />
          <Count value={shelves ? compactCount(shelves.read.pages) : "–"} label="páginas" />
          <Count
            value={compactCount(profile.followers)}
            label="seguidores"
            onPress={onPressCount && (() => onPressCount("followers"))}
          />
          <Count
            value={compactCount(profile.following)}
            label="seguindo"
            onPress={onPressCount && (() => onPressCount("following"))}
          />
        </View>

        {profile.profileSong && <SongCard song={profile.profileSong} />}
      </View>
    </View>
  );
}

function Count({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.count, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text variant="number" style={styles.number}>
        {value}
      </Text>
      <Text variant="small" color="textMuted">
        {label}
      </Text>
    </Pressable>
  );
}

const AVATAR = 88;

const styles = StyleSheet.create({
  root: { marginHorizontal: -spacing[4], marginTop: -spacing[4] },
  cover: { height: 132 },
  corner: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    flexDirection: "row",
    gap: spacing[2],
  },
  body: { paddingHorizontal: spacing[4], gap: spacing[3] },
  avatarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: -(AVATAR / 2),
  },
  avatarRing: { borderWidth: 4, borderRadius: radius.full },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: radius.full },
  initial: { alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: spacing[2], paddingBottom: spacing[1] },
  names: { gap: spacing[1] },
  counts: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
  },
  count: { flex: 1, alignItems: "center" },
  number: { fontSize: 20, lineHeight: 26 },
});
