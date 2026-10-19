import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, View, type ViewProps } from "react-native";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const liquidGlass = isLiquidGlassAvailable();

/**
 * Floating chrome (pills, sheets, small buttons). iOS 26+: system liquid glass;
 * elsewhere a translucent page with a hairline edge, like the web `glass` utility.
 */
export function Glass({ style, interactive, ...props }: ViewProps & { interactive?: boolean }) {
  const theme = useTheme();
  if (liquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        style={[styles.base, style]}
        {...props}
      />
    );
  }
  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { backgroundColor: theme.glass, borderColor: theme.glassBorder, shadowColor: theme.shadow },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xl, overflow: "hidden" },
  fallback: {
    borderWidth: 1,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    overflow: "visible",
  },
});
