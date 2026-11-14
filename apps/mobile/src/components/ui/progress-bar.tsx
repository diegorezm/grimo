import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { radius, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Thin rounded bar; `percent` is 0–100. `animate`: fills from empty the first time (and moves
 * to new values smoothly); off with reduce motion.
 */
export function ProgressBar({
  percent,
  color = "accent",
  height = 6,
  animate = false,
}: {
  percent: number;
  color?: ThemeColor;
  height?: number;
  animate?: boolean;
}) {
  const theme = useTheme();
  const target = Math.min(100, Math.max(0, percent));
  const width = useSharedValue(animate ? 0 : target);
  useEffect(() => {
    width.value = withTiming(target, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [target, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={[styles.track, { height, backgroundColor: theme.surfaceMuted }]}
    >
      <Animated.View style={[styles.bar, { backgroundColor: theme[color] }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.full, overflow: "hidden", alignSelf: "stretch" },
  bar: { height: "100%", borderRadius: radius.full },
});
