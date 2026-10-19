import { StyleSheet, View } from "react-native";
import { radius, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Thin rounded bar; `percent` is 0–100. */
export function ProgressBar({
  percent,
  color = "accent",
  height = 6,
}: {
  percent: number;
  color?: ThemeColor;
  height?: number;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={[styles.track, { height, backgroundColor: theme.surfaceMuted }]}
    >
      <View
        style={[
          styles.bar,
          { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: theme[color] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.full, overflow: "hidden", alignSelf: "stretch" },
  bar: { height: "100%", borderRadius: radius.full },
});
