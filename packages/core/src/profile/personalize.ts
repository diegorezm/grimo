import { z } from "zod";

/**
 * What a reader can make their own on the profile: the cover color, pronouns, the "trilha da
 * leitura" (a song link), the four "livros de cabeceira", a highlighted quote and which reading
 * cards show. Shared by the edit screens (web and mobile) and the backend.
 */

/** Profile cover colors, from the journal palette (each app maps them to its tokens). */
export const PROFILE_COLORS = ["lilac", "rose", "gold", "sage", "plum"] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];
export const DEFAULT_PROFILE_COLOR: ProfileColor = "lilac";

export const PROFILE_COLOR_LABELS: Record<ProfileColor, string> = {
  lilac: "Lilás",
  rose: "Rosa",
  gold: "Dourado",
  sage: "Verde",
  plum: "Ameixa",
};

/** "Livros de cabeceira": at most this many favorites. */
export const MAX_FAVORITE_BOOKS = 4;

/**
 * Where a song link may point. Only a link is kept: the apps open it, nothing is embedded (a
 * player would load a third party's scripts and cookies in the app).
 */
export const MUSIC_HOSTS = {
  "open.spotify.com": "Spotify",
  "music.apple.com": "Apple Music",
  "music.youtube.com": "YouTube Music",
  "www.youtube.com": "YouTube",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "deezer.com": "Deezer",
  "www.deezer.com": "Deezer",
} as const;

/** The service a song link is from ("Spotify"), or null when it isn't one we accept. */
export function musicService(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return MUSIC_HOSTS[parsed.hostname.toLowerCase() as keyof typeof MUSIC_HOSTS] ?? null;
  } catch {
    return null;
  }
}

export const profileSongSchema = z.object({
  title: z.string().trim().min(1, "Qual é o nome da música?").max(80),
  artist: z.string().trim().min(1, "De quem é a música?").max(80),
  url: z
    .string()
    .trim()
    .max(300)
    .refine(
      (url) => musicService(url) !== null,
      "Cole um link do Spotify, Apple Music, YouTube ou Deezer",
    ),
});
export type ProfileSong = z.infer<typeof profileSongSchema>;

/** The reading cards a profile shows; each can be hidden. */
export const profileShowsSchema = z.object({
  goal: z.boolean(),
  reading: z.boolean(),
  streak: z.boolean(),
});
export type ProfileShows = z.infer<typeof profileShowsSchema>;
export const DEFAULT_PROFILE_SHOWS: ProfileShows = { goal: true, reading: true, streak: false };

export const pronounsSchema = z
  .string()
  .trim()
  .max(24, "Use até 24 caracteres")
  .transform((value) => (value === "" ? null : value));
