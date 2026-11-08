import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui";
import { musicServiceColors, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface SongCardData {
  title: string;
  artist: string;
  url: string;
  service: string | null;
  /** Our stored copy (or, while editing, the preview's data URL). Never the service's own. */
  coverUrl: string | null;
  /** Card background taken from the cover. */
  color: string | null;
}

/**
 * "Trilha da leitura": the cover, the song and the artist on a card in the cover's color.
 * Tapping opens the song in its own app (nothing plays or loads here).
 */
export function SongCard({
  song,
  interactive = true,
}: {
  song: SongCardData;
  interactive?: boolean;
}) {
  const theme = useTheme();
  const background = song.color ?? theme.inverse;
  const ink = theme.inverseForeground;
  const listen = song.service ? `Ouvir no ${song.service}` : "Ouvir";
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${song.title}, de ${song.artist}. ${listen}`}
      disabled={!interactive}
      onPress={() => Linking.openURL(song.url)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: background, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {song.coverUrl ? (
        <Image source={song.coverUrl} style={styles.cover} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cover, styles.noCover, { borderColor: ink }]}>
          <Text style={[styles.note, { color: ink }]}>♪</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text variant="label" style={{ color: ink, opacity: 0.75 }}>
          Trilha da leitura
        </Text>
        <Text numberOfLines={2} style={[styles.title, { color: ink }]}>
          {song.title}
        </Text>
        <Text variant="small" numberOfLines={1} style={{ color: ink, opacity: 0.85 }}>
          {song.artist}
        </Text>
        <View style={styles.service}>
          {song.service && (
            <View
              style={[
                styles.dot,
                { backgroundColor: musicServiceColors[song.service] ?? theme.accent },
              ]}
            />
          )}
          <Text variant="small" style={{ color: ink, opacity: 0.85 }}>
            {listen}
          </Text>
        </View>
      </View>
      <View style={[styles.play, { backgroundColor: ink }]}>
        <Svg width={14} height={14} viewBox="0 0 24 24" accessibilityElementsHidden>
          <Path d="M7 4v16l13-8z" fill={background} />
        </Svg>
      </View>
    </Pressable>
  );
}

const COVER = 76;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radius.xl,
    padding: spacing[3],
  },
  cover: { width: COVER, height: COVER, borderRadius: radius.md },
  noCover: { borderWidth: 1, alignItems: "center", justifyContent: "center", opacity: 0.6 },
  note: { fontSize: 28, lineHeight: 34 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  service: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  play: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
