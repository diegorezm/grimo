import { StyleSheet, View, type ViewProps } from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.base, { backgroundColor: theme.surface, borderColor: theme.border }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderRadius: radius.lg, padding: spacing[4], gap: spacing[3] },
});
