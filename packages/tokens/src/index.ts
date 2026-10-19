/**
 * Design tokens — the single source of styling truth for web and mobile.
 * Web: `theme.css` (Tailwind v4 `@theme`) is generated from this file — run
 * `pnpm --filter @grimo/tokens generate` after editing.
 * Mobile: import these objects directly into StyleSheets.
 */

/**
 * "Diário" palette: a reading journal on a warm desk. Cream pages, plum ink, hairline ruled
 * lines, rose → lavender as the accent pair and gold for sparkles / progress. Night mode is
 * the same journal by lamplight: deep plum desk, raised pages, softened accents.
 */
const palette = {
  desk: "#F3E9E1",
  page: "#FFFBF5",
  pageEdge: "#E8D8D6",
  ink: "#3A2E3F",
  inkMuted: "#7A6B78",
  ruled: "#DCC9D6",
  blush: "#F6D6DF",
  lilacMist: "#E5DAF5",
  rose: "#E7A1B5",
  lavender: "#9C7CD6",
  lilac: "#B9A0C9",
  gold: "#D6AE55",
  track: "#F1E8F4",
  cream: "#FBF5EE",
  nightDesk: "#17121E",
  nightPage: "#262030",
  nightEdge: "#362D42",
  nightInk: "#F3EAF2",
  nightMuted: "#B3A6B8",
  nightRuled: "#4A3E56",
  nightRose: "#EBA9BC",
  nightLavender: "#B79AE6",
  nightGold: "#E9C870",
  nightTrack: "#3A3045",
  nightBar: "#352C3F",
  danger: "#B4434F",
  dangerLight: "#F08A95",
} as const;

export const colors = {
  light: {
    background: palette.desk,
    surface: palette.page,
    surfaceMuted: palette.track,
    text: palette.ink,
    textMuted: palette.inkMuted,
    border: palette.ruled,
    /** Page edge: borders of raised cards ("pages"). */
    edge: palette.pageEdge,
    primary: palette.ink,
    primaryForeground: palette.cream,
    /** Dark bars on the desk (shortcut bar, highlighted chips). */
    inverse: palette.ink,
    inverseForeground: palette.cream,
    /** Rose → lavender pair; `accent` alone is the lavender. */
    accent: palette.lavender,
    accentStart: palette.rose,
    accentForeground: "#FFFFFF",
    /** Sparkles, star ratings, monthly goal bar. */
    gold: palette.gold,
    ornament: palette.lilac,
    glowA: palette.blush,
    glowB: palette.lilacMist,
    /** Highlighter stroke behind the selected row (rose → lavender). */
    highlightStart: "#FBD3DF",
    highlightEnd: "#E3D6FA",
    /** Sticky note and its washi tape. */
    note: "#FFF6DA",
    tape: "#F2A9BD",
    /** Liquid glass fill (translucent page). */
    glass: "rgba(255,251,245,0.55)",
    glassBorder: "rgba(255,255,255,0.85)",
    shadow: "rgba(120,90,140,0.20)",
    success: "#2F6B4F",
    danger: palette.danger,
  },
  dark: {
    background: palette.nightDesk,
    surface: palette.nightPage,
    surfaceMuted: palette.nightTrack,
    text: palette.nightInk,
    textMuted: palette.nightMuted,
    border: palette.nightRuled,
    edge: palette.nightEdge,
    primary: palette.nightInk,
    primaryForeground: palette.nightDesk,
    inverse: palette.nightBar,
    inverseForeground: palette.nightInk,
    accent: palette.nightLavender,
    accentStart: palette.nightRose,
    accentForeground: palette.nightDesk,
    gold: palette.nightGold,
    ornament: "#8D78A4",
    glowA: "rgba(231,161,181,0.12)",
    glowB: "rgba(156,124,214,0.16)",
    highlightStart: "rgba(235,169,188,0.35)",
    highlightEnd: "rgba(183,154,230,0.35)",
    note: "#3B3122",
    tape: "#C97A93",
    glass: "rgba(38,32,48,0.55)",
    glassBorder: "rgba(243,234,242,0.14)",
    shadow: "rgba(0,0,0,0.40)",
    success: "#A8D5BF",
    danger: palette.dangerLight,
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.light;

/** Shelf badge colors (background / text / border), per scheme. */
export const shelfBadges = {
  light: {
    want_to_read: { bg: "#FBF0CF", fg: "#8A6A1C", border: "#EEDDA6" },
    reading: { bg: "#FBE3EA", fg: "#A3405E", border: "#F2C3D1" },
    read: { bg: "#E1F2E9", fg: "#2F6B4F", border: "#C3E3D2" },
    abandoned: { bg: "#EEEAF0", fg: "#6E6372", border: "#DCD5E0" },
  },
  dark: {
    want_to_read: { bg: "#4A3F24", fg: "#F0D68A", border: "#5E512F" },
    reading: { bg: "#4A2E3A", fg: "#F2B8C8", border: "#5E3A49" },
    read: { bg: "#2B4238", fg: "#A8D5BF", border: "#375446" },
    abandoned: { bg: "#33303A", fg: "#B3A6B8", border: "#433E4B" },
  },
} as const;

/** One color per shelf (light badge text) — charts and the monthly card. */
export const shelfColors = {
  want_to_read: shelfBadges.light.want_to_read.fg,
  reading: shelfBadges.light.reading.fg,
  read: shelfBadges.light.read.fg,
  abandoned: shelfBadges.light.abandoned.fg,
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

/** Soft journal corners: covers stay tight, pages and glass are round. */
export const radius = { sm: 6, md: 14, lg: 18, xl: 24, full: 9999 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, "2xl": 28, "3xl": 36 } as const;

export const fonts = {
  /** Headings / book titles — literary feel. */
  serif: "Fraunces",
  /** Long-form reading text (reviews, notes). */
  sans: "Nunito",
  /** UI chrome: labels, numbers, dates, buttons, nav — the journal's typewriter voice. */
  mono: "IBM Plex Mono",
} as const;

/** Instagram Stories canvas for the shareable monthly card. */
export const storyCard = { width: 1080, height: 1920 } as const;

/**
 * Fixed palettes for the shareable card. Independent of light/dark: the exported image must look
 * the same for everyone. `bg`/`ink`/`muted` for the base, `accent`/`accent2` for the ribbon,
 * highlights and charts, `paper` for raised surfaces on the card.
 */
export const cardPalettes = {
  noite: {
    label: "Noite",
    bg: "#17121E",
    paper: "#262030",
    ink: "#F3EAF2",
    muted: "#B3A6B8",
    accent: "#EBA9BC",
    accent2: "#B79AE6",
  },
  brasa: {
    label: "Brasa",
    bg: "#141210",
    paper: "#24201C",
    ink: "#FFFFFF",
    muted: "#B8ADA3",
    accent: "#FF5A1F",
    accent2: "#FFB38A",
  },
  lavanda: {
    label: "Lavanda",
    bg: "#E9DFF7",
    paper: "#FFFBF5",
    ink: "#3A2E3F",
    muted: "#7A6B78",
    accent: "#8B66D6",
    accent2: "#E7A1B5",
  },
  oceano: {
    label: "Oceano",
    bg: "#0F2A3D",
    paper: "#173A52",
    ink: "#EAF4F8",
    muted: "#9DB8C6",
    accent: "#4FC3B5",
    accent2: "#F2CB4E",
  },
  pessego: {
    label: "Pêssego",
    bg: "#FFE3D3",
    paper: "#FFF6EF",
    ink: "#4A2A20",
    muted: "#94675A",
    accent: "#F0683A",
    accent2: "#E58FB0",
  },
  oliva: {
    label: "Oliva",
    bg: "#E9E4D6",
    paper: "#F6F2E8",
    ink: "#2B2B26",
    muted: "#6E6B5E",
    accent: "#5F7034",
    accent2: "#C9A04B",
  },
} as const;

export type CardPaletteKey = keyof typeof cardPalettes;
export type CardPalette = (typeof cardPalettes)[CardPaletteKey];
