/**
 * Design tokens — the single source of styling truth for web and mobile.
 * Web: `theme.css` (Tailwind v4 `@theme`) is generated from this file — run
 * `pnpm --filter @grimo/tokens generate` after editing.
 * Mobile: import these objects directly into StyleSheets.
 */

const palette = {
  paper: "#FBF7F0",
  paperDeep: "#F2ECE2",
  ink: "#1F1B16",
  inkSoft: "#6B6257",
  line: "#E5DDD0",
  terracotta: "#B4532A",
  terracottaLight: "#E07A4B",
  moss: "#2F7D5B",
  plum: "#6E3D6B",
  ochre: "#C08A1E",
  night: "#14110E",
  nightRaised: "#1E1A16",
  nightDeep: "#2A241F",
  nightLine: "#3A322B",
  parchment: "#F5EFE6",
  dust: "#A89D90",
  white: "#FFFFFF",
  danger: "#B42318",
} as const;

export const colors = {
  light: {
    background: palette.paper,
    surface: palette.white,
    surfaceMuted: palette.paperDeep,
    text: palette.ink,
    textMuted: palette.inkSoft,
    border: palette.line,
    primary: palette.terracotta,
    primaryForeground: palette.white,
    success: palette.moss,
    danger: palette.danger,
  },
  dark: {
    background: palette.night,
    surface: palette.nightRaised,
    surfaceMuted: palette.nightDeep,
    text: palette.parchment,
    textMuted: palette.dust,
    border: palette.nightLine,
    primary: palette.terracottaLight,
    primaryForeground: palette.night,
    success: "#4FA683",
    danger: "#F97066",
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

/** One color per shelf — used for badges, charts and the monthly card. */
export const shelfColors = {
  want_to_read: palette.ochre,
  reading: palette.terracotta,
  read: palette.moss,
  abandoned: palette.plum,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, "2xl": 28, "3xl": 36 } as const;

export const fonts = {
  /** Headings / book titles — literary feel. */
  serif: "Fraunces",
  sans: "Inter",
} as const;

/** Instagram Stories canvas for the shareable monthly card. */
export const storyCard = { width: 1080, height: 1920 } as const;
