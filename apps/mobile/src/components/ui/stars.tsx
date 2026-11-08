import { formatRating, nextRating, RATING_STEP, type StarFill, starFills } from "@grimo/core";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/** One star: gold, half gold or empty. */
function Star({ fill, size }: { fill: StarFill; size: number }) {
  const theme = useTheme();
  // The glyph is taller than the body text line (22): without its own line height it is cut.
  const glyph = { fontSize: size, lineHeight: Math.ceil(size * 1.25) };
  return (
    <View>
      <Text style={[glyph, { color: theme.border }]}>★</Text>
      {fill !== "empty" && (
        <View style={[styles.fill, { width: fill === "half" ? "50%" : "100%" }]}>
          <Text numberOfLines={1} style={[glyph, { color: theme.gold }]}>
            ★
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Rating in half stars. With `onChange` it is an input: the left half of a star gives its ½,
 * the right half the whole star, and tapping the current rating clears it.
 */
export function Stars({
  value,
  onChange,
  size = 18,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
}) {
  const fills = starFills(value);
  return (
    <View
      style={styles.row}
      accessibilityLabel={`${formatRating(value ?? 0)} de 5 estrelas`}
      accessible={!onChange}
    >
      {[1, 2, 3, 4, 5].map((star, i) => {
        if (!onChange) return <Star key={star} fill={fills[i]!} size={size} />;
        return (
          <View key={star} style={styles.touch}>
            <Star fill={fills[i]!} size={size} />
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.halves}>
                {[star - RATING_STEP, star].map((rating) => (
                  <Pressable
                    key={rating}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatRating(rating)} de 5`}
                    accessibilityState={{ selected: rating === value }}
                    onPress={() => onChange(nextRating(value, rating))}
                    style={styles.half}
                  />
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2, alignItems: "center" },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0, overflow: "hidden" },
  touch: { minWidth: 36, minHeight: 44, alignItems: "center", justifyContent: "center" },
  halves: { flex: 1, flexDirection: "row" },
  half: { flex: 1 },
});
