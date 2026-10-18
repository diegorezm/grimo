import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Input({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      style={[
        styles.base,
        { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSize.md,
  },
});
