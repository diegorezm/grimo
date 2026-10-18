import { colors } from "@grimo/tokens";
import { Platform } from "react-native";

// Colors/spacing/radius come from @grimo/tokens (shared with web). Only platform fonts live here.
export { fontSize, radius, shelfColors, spacing, storyCard } from "@grimo/tokens";

export const Colors = colors;
export type ThemeColor = keyof typeof colors.light;

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", mono: "ui-monospace" },
  web: {
    sans: "Inter, system-ui, sans-serif",
    serif: "Fraunces, Georgia, serif",
    mono: "ui-monospace, monospace",
  },
  default: { sans: "normal", serif: "serif", mono: "monospace" },
});
