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
 * "Trilha da leitura": a slim strip in the cover's color with the cover, the song and the
 * artist. Tapping opens the song in its own app (nothing plays or loads here). `onRemove`
 * (editing): a "Tirar" button in place of play.
 */
export function SongCard({
  song,
  interactive = true,
  onRemove,
}: {
  song: SongCardData;
  interactive?: boolean;
  onRemove?: () => void;
}) {
  const theme = useTheme();
  const background = song.color ?? theme.inverse;
  const ink = theme.inverseForeground;
  const listen = song.service ? `Ouvir no ${song.service}` : "Ouvir";
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Trilha da leitura: ${song.title}, de ${song.artist}. ${listen}`}
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
        <Text numberOfLines={1} style={[styles.title, { color: ink }]}>
          {song.title}
          <Text style={[styles.artist, { color: ink }]}> · {song.artist}</Text>
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
          <Text variant="small" numberOfLines={1} style={[styles.meta, { color: ink }]}>
            Trilha da leitura · {listen}
          </Text>
        </View>
      </View>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tirar a música"
          onPress={onRemove}
          hitSlop={8}
          style={styles.remove}
        >
          <Text variant="label" style={{ color: ink }}>
            Tirar
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.play, { backgroundColor: ink }]}>
          <Svg width={12} height={12} viewBox="0 0 24 24" accessibilityElementsHidden>
            <Path d="M7 4v16l13-8z" fill={background} />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

const COVER = 44;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radius.lg,
    paddingVertical: spacing[2],
    paddingLeft: spacing[2],
    paddingRight: spacing[3],
  },
  cover: { width: COVER, height: COVER, borderRadius: radius.sm },
  noCover: { borderWidth: 1, alignItems: "center", justifyContent: "center", opacity: 0.6 },
  note: { fontSize: 20, lineHeight: 24 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "700" },
  artist: { fontWeight: "400", opacity: 0.85 },
  service: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  meta: { opacity: 0.8, flexShrink: 1 },
  remove: { paddingHorizontal: spacing[2], paddingVertical: spacing[2] },
  play: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
