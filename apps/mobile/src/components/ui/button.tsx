import { Pressable, type PressableProps, StyleSheet } from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  title,
  variant = "primary",
  style,
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const theme = useTheme();
  const background = {
    primary: theme.accent,
    secondary: theme.surface,
    ghost: "transparent",
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        variant === "primary" && {
          shadowColor: theme.accent,
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        },
        variant === "secondary" && { borderWidth: 1, borderColor: theme.border },
        { backgroundColor: background, opacity: state.pressed || props.disabled ? 0.6 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text variant="label" color={variant === "primary" ? "accentForeground" : "text"}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
});
