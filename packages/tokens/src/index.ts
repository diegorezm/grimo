/**
 * Design tokens — the single source of styling truth for web and mobile.
 * Web: `theme.css` (Tailwind v4 `@theme`) is generated from this file — run
 * `pnpm --filter @grimo/tokens generate` after editing.
 * Mobile: import these objects directly into StyleSheets.
 */

/**
 * "Archive" palette: aged paper, carbon ink, hairline borders and a single olive accent,
 * like a personal archive / catalog card. Color is rare: ink does the work, olive marks
 * state (reading, active, success). Dark mode is the carbon panel with paper ink.
 */
const palette = {
  paper: "#E9E4D6",
  paperLight: "#F1EDE3",
  paperDeep: "#DFD8C7",
  ink: "#1C1B18",
  inkSoft: "#6A655A",
  line: "#C7BFAE",
  carbon: "#1B1A17",
  carbonRaised: "#242320",
  carbonDeep: "#2E2C28",
  carbonLine: "#3D3A34",
  parchment: "#E8E3D5",
  dust: "#9C968A",
  olive: "#5B7A3A",
  oliveLight: "#8BA866",
  ochre: "#A8853F",
  rust: "#9A5A3A",
  slate: "#4F6272",
  danger: "#A3362A",
  dangerLight: "#E07A6A",
} as const;

export const colors = {
  light: {
    background: palette.paper,
    surface: palette.paperLight,
    surfaceMuted: palette.paperDeep,
    text: palette.ink,
    textMuted: palette.inkSoft,
    border: palette.line,
    primary: palette.ink,
    primaryForeground: palette.paperLight,
    /** Dark panels on paper (sidebar, highlighted cards, the monthly card). */
    inverse: palette.carbon,
    inverseForeground: palette.parchment,
    accent: palette.olive,
    success: palette.olive,
    danger: palette.danger,
  },
  dark: {
    background: palette.carbon,
    surface: palette.carbonRaised,
    surfaceMuted: palette.carbonDeep,
    text: palette.parchment,
    textMuted: palette.dust,
    border: palette.carbonLine,
    primary: palette.parchment,
    primaryForeground: palette.carbon,
    inverse: palette.paper,
    inverseForeground: palette.ink,
    accent: palette.oliveLight,
    success: palette.oliveLight,
    danger: palette.dangerLight,
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

/** One color per shelf — used for badges, charts and the monthly card. */
export const shelfColors = {
  want_to_read: palette.ochre,
  reading: palette.olive,
  read: palette.slate,
  abandoned: palette.rust,
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
