import { Pressable, StyleSheet } from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

/** A filter or choice pill: outlined, filled with ink when active. */
export function Chip({
  label,
  active = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          // Active is a light lilac wash, never a dark fill (the app's light look).
          borderColor: active ? theme.accent : theme.border,
          backgroundColor: active ? theme.glowB : theme.surface,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text variant="small" style={[{ color: theme.text }, active && { fontWeight: "700" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
  },
});
