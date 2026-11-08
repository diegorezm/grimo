import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * A small glass pill on the profile cover ("Editar perfil", "Ajustes", "‹ Voltar", "⋯"): the
 * look of a button, but low and quiet so the cover stays the cover.
 */
export function CoverButton({
  title,
  accessibilityLabel,
  onPress,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: theme.glass,
          borderColor: theme.glassBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="label" style={styles.title}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 11, lineHeight: 14 },
});
