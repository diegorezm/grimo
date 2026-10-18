import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";
import { Fonts, fontSize, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextProps = RNTextProps & {
  variant?: "body" | "small" | "title" | "heading" | "display";
  color?: ThemeColor;
};

export function Text({ style, variant = "body", color = "text", ...rest }: TextProps) {
  const theme = useTheme();
  return <RNText style={[{ color: theme[color] }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  body: { fontSize: fontSize.md, lineHeight: 22 },
  small: { fontSize: fontSize.sm, lineHeight: 18 },
  title: { fontSize: fontSize.lg, fontFamily: Fonts?.serif, fontWeight: "600" },
  heading: { fontSize: fontSize["2xl"], fontFamily: Fonts?.serif, fontWeight: "700" },
  display: { fontSize: fontSize["3xl"], fontFamily: Fonts?.serif, fontWeight: "700" },
});
