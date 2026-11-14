import {
  averageColor,
  musicService,
  parseSongPage,
  type SongMeta,
  songCardColor,
} from "@grimo/core";
import { v } from "convex/values";
import jpeg from "jpeg-js";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation } from "./_generated/server";
import { appError, unauthenticated } from "./model/errors";
import { enforceRateLimit } from "./model/rateLimit";

/**
 * "Trilha da leitura": the backend reads a music link (name, artist, cover) so the reader only
 * pastes it. The cover is copied into our storage, so the apps never load anything from the
 * music service; only tapping "Ouvir" leaves the app.
 */

/** Covers bigger than this are not copied (a cover is ~50 KB). */
const MAX_COVER_BYTES = 2 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (compatible; Grimo/1.0; +https://grimo.app)";

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/** What the link's page (or YouTube's oEmbed) says about the song. */
async function songMeta(url: string): Promise<SongMeta> {
  const service = musicService(url);
  if (service === "YouTube" || service === "YouTube Music") {
    const oembed = JSON.parse(
      await fetchText(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.replace("music.youtube.com", "www.youtube.com"))}`,
      ),
    ) as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      title: oembed.title ?? null,
      artist: oembed.author_name?.replace(/ - Topic$/, "") ?? null,
      image: oembed.thumbnail_url ?? null,
    };
  }
  return parseSongPage(await fetchText(url));
}

/** The cover's bytes, or null when it can't be fetched (the card then shows a note). */
async function coverBytes(image: string | null) {
  if (!image?.startsWith("https://")) return null;
  const response = await fetch(image, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const type = response.headers.get("content-type") ?? "image/jpeg";
  if (!type.startsWith("image/")) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes.length > MAX_COVER_BYTES ? null : { bytes, type };
}

/** The card color from a JPEG cover (most are); null for other formats. */
function coverColor(cover: { bytes: Uint8Array; type: string }) {
  if (!cover.type.includes("jpeg") && !cover.type.includes("jpg")) return null;
  try {
    const { data } = jpeg.decode(cover.bytes, { useTArray: true, maxMemoryUsageInMB: 64 });
    const average = averageColor(data);
    return average ? songCardColor(average) : null;
  } catch {
    return null;
  }
}

const base64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

/**
 * Editar perfil: the reader pasted a link. Name, artist and the cover (as a data URL, so the
 * edit screen doesn't load the music service either) to fill in the fields.
 */
export const preview = action({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw unauthenticated();
    const service = musicService(url.trim());
    if (!service) {
      throw appError("INVALID", "Cole um link do Spotify, Apple Music, YouTube ou Deezer");
    }
    await enforceRateLimit(ctx, "songPreview", identity.subject);
    try {
      const meta = await songMeta(url.trim());
      const cover = await coverBytes(meta.image);
      return {
        service,
        title: meta.title,
        artist: meta.artist,
        cover: cover ? `data:${cover.type};base64,${base64(cover.bytes)}` : null,
        color: cover ? coverColor(cover) : null,
      };
    } catch {
      throw appError("INVALID", `Não conseguimos ler esse link do ${service}. Preencha à mão.`);
    }
  },
});

/** After a new song is saved: copy its cover into our storage and take the card color. */
export const storeCover = internalAction({
  args: { userId: v.id("users"), url: v.string() },
  handler: async (ctx, { userId, url }) => {
    try {
      const meta = await songMeta(url);
      const cover = await coverBytes(meta.image);
      if (!cover) return null;
      const storageId = await ctx.storage.store(new Blob([cover.bytes], { type: cover.type }));
      await ctx.runMutation(internal.songs.setCover, {
        userId,
        url,
        storageId,
        color: coverColor(cover) ?? undefined,
      });
    } catch {
      // No cover: the card shows the song without it. The next save tries again.
    }
    return null;
  },
});

export const setCover = internalMutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    storageId: v.id("_storage"),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { userId, url, storageId, color }) => {
    const user = await ctx.db.get(userId);
    const song = user?.profileSong;
    // The reader changed or removed the song meanwhile (or left): this cover is not needed.
    if (!user || user.deletedAt || !song || song.url !== url) {
      await ctx.storage.delete(storageId);
      return null;
    }
    if (song.coverStorageId) await ctx.storage.delete(song.coverStorageId);
    await ctx.db.patch(userId, { profileSong: { ...song, coverStorageId: storageId, color } });
    return null;
  },
});
