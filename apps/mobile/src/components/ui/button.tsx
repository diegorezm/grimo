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
    primary: theme.primary,
    secondary: theme.surfaceMuted,
    ghost: "transparent",
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        { backgroundColor: background, opacity: state.pressed || props.disabled ? 0.6 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text variant="label" color={variant === "primary" ? "primaryForeground" : "text"}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
