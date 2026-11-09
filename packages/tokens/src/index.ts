/**
 * Design tokens — the single source of styling truth for web and mobile.
 * Web: `theme.css` (Tailwind v4 `@theme`) is generated from this file — run
 * `pnpm --filter @grimo/tokens generate` after editing.
 * Mobile: import these objects directly into StyleSheets.
 */

/**
 * "Diário" palette: a reading journal on a white desk. Cream pages, plum ink, hairline ruled
 * lines, rose → lavender as the accent pair and gold for sparkles / progress. Night mode is
 * the same journal by lamplight: deep plum desk, raised pages, softened accents.
 */
const palette = {
  desk: "#FFFFFF",
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
    /** The lavender dark enough for small text on the page (links, labels). */
    accentInk: "#7E5FC0",
    accentForeground: "#FFFFFF",
    /** Sparkles, star ratings, monthly goal bar. */
    gold: palette.gold,
    ornament: palette.lilac,
    /** Logo: book cover and spine (pages use accentStart / accent, the block uses surface). */
    logoCover: palette.ink,
    logoSpine: palette.ink,
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
    accentInk: palette.nightLavender,
    accentForeground: palette.nightDesk,
    gold: palette.nightGold,
    ornament: "#8D78A4",
    logoCover: "#8D78A4",
    logoSpine: palette.nightDesk,
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

/**
 * Illustrated reading themes are paintings with their own colors, whatever the app theme: the
 * timer's tokens follow the picture so the text stays readable on it. Web: `theme.css`
 * (`[data-reading-scene]`). Mobile: use instead of `useTheme()` colors on the timer.
 */
const warmDusk = {
  surface: "#2a1d16",
  surfaceMuted: "#3a2a20",
  text: "#fbf1dc",
  textMuted: "#e0d0b6",
  border: "#8a7360",
  accent: "#f0b878",
  accentStart: "#f6cf94",
  accentForeground: "#2a1d16",
  primary: "#fbf1dc",
  primaryForeground: "#2a1d16",
};

export const readingScenePalettes = {
  cozy: {
    surface: "#fdf8ea",
    surfaceMuted: "#f3e8cf",
    text: "#33261c",
    textMuted: "#6d5a48",
    border: "#d8c7a6",
    accent: "#a8482f",
    accentStart: "#c0603c",
    accentForeground: "#fdf8ea",
    primary: "#33261c",
    primaryForeground: "#fdf8ea",
  },
  window: warmDusk,
  sunset: warmDusk,
};

/**
 * Profile cover colors (`PROFILE_COLORS` in `@grimo/core`), per scheme. `ink` is the text on
 * top of the cover.
 */
export const profileCovers = {
  light: {
    lilac: { bg: palette.lilacMist, ink: palette.ink },
    rose: { bg: palette.blush, ink: palette.ink },
    gold: { bg: "#FBF0CF", ink: palette.ink },
    sage: { bg: "#E1F2E9", ink: palette.ink },
    plum: { bg: palette.ink, ink: palette.cream },
  },
  dark: {
    lilac: { bg: "#3A3045", ink: palette.nightInk },
    rose: { bg: "#4A2E3A", ink: palette.nightInk },
    gold: { bg: "#4A3F24", ink: palette.nightInk },
    sage: { bg: "#2B4238", ink: palette.nightInk },
    plum: { bg: palette.nightBar, ink: palette.nightInk },
  },
} as const;

/**
 * Bookcase colors (`BOOKCASE_COLORS` in `@grimo/core`), per scheme: `wall` for the sides, top
 * and planks, `back` for the panel behind the books.
 */
export const bookcaseColors = {
  light: {
    lilac: { wall: palette.ruled, back: palette.track },
    oak: { wall: "#D9BE98", back: "#F6ECDD" },
    walnut: { wall: "#8A6448", back: "#EADCCD" },
    sage: { wall: "#A9BFA8", back: "#EAF1E8" },
    rose: { wall: "#EDB9C8", back: "#FBE9EE" },
    graphite: { wall: "#6E6372", back: "#ECEAEE" },
  },
  dark: {
    lilac: { wall: palette.nightRuled, back: "#2C2436" },
    oak: { wall: "#6E5638", back: "#2E271F" },
    walnut: { wall: "#5A4030", back: "#2A211B" },
    sage: { wall: "#3F5240", back: "#1F2620" },
    rose: { wall: "#6B4351", back: "#2E2128" },
    graphite: { wall: "#4A4550", back: "#222026" },
  },
} as const;

/** Brand color of each music service, for the dot beside "Ouvir no …" on the profile song. */
export const musicServiceColors: Record<string, string> = {
  Spotify: "#1ED760",
  "Apple Music": "#FA243C",
  YouTube: "#FF0033",
  "YouTube Music": "#FF0033",
  Deezer: "#A238FF",
};
