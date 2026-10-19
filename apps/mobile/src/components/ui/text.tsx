import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";
import { Fonts, fontSize, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextProps = RNTextProps & {
  /** `label` / `number` use the mono "archive" voice; titles use the serif. */
  variant?: "body" | "small" | "label" | "number" | "title" | "heading" | "display";
  color?: ThemeColor;
};

export function Text({ style, variant = "body", color = "text", ...rest }: TextProps) {
  const theme = useTheme();
  return <RNText style={[{ color: theme[color] }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  body: { fontFamily: Fonts.sans, fontSize: fontSize.md, lineHeight: 22 },
  small: { fontFamily: Fonts.sans, fontSize: fontSize.sm, lineHeight: 18 },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  number: { fontFamily: Fonts.monoBold, fontSize: fontSize["2xl"] },
  title: { fontSize: fontSize.lg, fontFamily: Fonts.serif },
  heading: { fontSize: fontSize["2xl"], fontFamily: Fonts.serifBold },
  display: { fontSize: fontSize["3xl"], fontFamily: Fonts.serifBold },
});
