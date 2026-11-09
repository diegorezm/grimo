import { type ConnectionKind, type Profile, useReaderShelves } from "@grimo/client";
import { compactCount } from "@grimo/core";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { Fonts, profileCovers, radius, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useCountUp, useFirstVisit } from "@/lib/motion";
import { AvatarPicker } from "./avatar-picker";
import { SongCard } from "./song-card";

/**
 * Profile top, like a magazine: photo with name, @ and pronouns beside it, the bio, the
 * highlighted quote (quiet, a quote mark and italics), the numbers in one line and the
 * "trilha da leitura". `corner`: buttons at the top right (compartilhar, editar, ⋯).
 * `actions`: beside the name (Seguir). `editable`: tapping the photo changes it.
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
  // The reader's color now rings the photo.
  const ring = profileCovers[scheme][profile.profileColor].bg;
  const role =
    profile.role === "admin" ? "ADMIN" : profile.role === "moderator" ? "MODERADOR" : null;
  const handle = [profile.username && `@${profile.username}`, profile.pronouns, role]
    .filter(Boolean)
    .join(" · ");
  const quote = profile.featuredQuote;
  // The first time this profile opens, its numbers count up.
  const animate = useFirstVisit(`numbers-${profile.username}`);

  return (
    <View style={styles.root}>
      {corner && <View style={styles.corner}>{corner}</View>}

      <View style={styles.identity}>
        {editable ? (
          <AvatarPicker image={profile.image} name={profile.name} />
        ) : (
          <View style={[styles.ring, { borderColor: ring }]}>
            {profile.image ? (
              <Image source={profile.image} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initial, { backgroundColor: theme.glowA }]}>
                <Text variant="display">{profile.name.slice(0, 1)}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.names}>
          <Text variant="display" numberOfLines={2}>
            {profile.name}
          </Text>
          {handle !== "" && (
            <Text variant="label" color="textMuted">
              {handle}
            </Text>
          )}
          {actions}
        </View>
      </View>

      <View style={styles.numbers}>
        <View style={styles.line}>
          <Stat count={shelves?.read.count ?? null} animate={animate} label="lidos" />
          <Dot />
          <Stat count={shelves?.read.pages ?? null} animate={animate} label="páginas" />
        </View>
        <View style={styles.line}>
          <Stat
            count={profile.followers}
            animate={animate}
            label="seguidores"
            onPress={onPressCount && (() => onPressCount("followers"))}
          />
          <Dot />
          <Stat
            count={profile.following}
            animate={animate}
            label="seguindo"
            onPress={onPressCount && (() => onPressCount("following"))}
          />
        </View>
      </View>

      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {quote && (
        <View style={styles.quote}>
          <Text style={[styles.quoteMark, { color: theme.ornament }]} accessibilityElementsHidden>
            “
          </Text>
          <View style={styles.grow}>
            <Text style={styles.quoteText}>{quote.body}</Text>
            {quote.bookTitle && (
              <Text variant="small" color="textMuted">
                {quote.bookTitle}
                {quote.page ? `, pág. ${quote.page}` : ""}
              </Text>
            )}
          </View>
        </View>
      )}

      {profile.profileSong && <SongCard song={profile.profileSong} />}
    </View>
  );
}

function Dot() {
  return (
    <Text color="textMuted" style={styles.dot}>
      ·
    </Text>
  );
}

/** "10 lidos", "1,9 mil páginas": the number in mono, the label in text, on one line. */
function Stat({
  count,
  animate,
  label,
  onPress,
}: {
  /** `null` while loading (a dash). */
  count: number | null;
  animate: boolean;
  label: string;
  onPress?: () => void;
}) {
  const shown = useCountUp(count ?? 0, animate);
  const value = count === null ? "–" : compactCount(Math.round(shown));
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text color="textMuted" numberOfLines={1} style={styles.stat}>
        <Text variant="label" style={styles.statValue}>
          {value}
        </Text>{" "}
        {label}
      </Text>
    </Pressable>
  );
}

const AVATAR = 80;

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  corner: { flexDirection: "row", justifyContent: "flex-end", gap: spacing[2] },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
  ring: { borderWidth: 3, borderRadius: radius.full, padding: 2 },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: radius.full },
  initial: { alignItems: "center", justifyContent: "center" },
  names: { flex: 1, gap: spacing[1], alignItems: "flex-start" },
  bio: { fontSize: 15, lineHeight: 22 },
  quote: { flexDirection: "row", gap: spacing[2] },
  quoteMark: { fontSize: 36, lineHeight: 36, fontStyle: "italic" },
  grow: { flex: 1, gap: 2, paddingTop: 2 },
  quoteText: { fontFamily: Fonts.serifItalic, fontSize: 17, lineHeight: 24 },
  numbers: { gap: spacing[1] },
  line: { flexDirection: "row", alignItems: "baseline" },
  dot: { marginHorizontal: 6 },
  stat: { fontSize: 15 },
  // Mono numbers in the ink color, without the label's capitals.
  statValue: { fontSize: 15, letterSpacing: 0, textTransform: "none", fontWeight: "600" },
});
