import jpeg from "jpeg-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { newTest, reader } from "./setup";

const SPOTIFY = "https://open.spotify.com/track/abc";
const OTHER = "https://open.spotify.com/track/xyz";

/** A 4×4 blue-ish JPEG, as a music service would send the cover. */
const cover = new Uint8Array(
  jpeg.encode(
    {
      width: 4,
      height: 4,
      data: Buffer.from(Array.from({ length: 16 }, () => [40, 90, 200, 255]).flat()),
    },
    90,
  ).data,
);

const page = (title: string) => `
  <meta property="og:title" content="${title}"/>
  <meta name="music:musician_description" content="Marconi Union"/>
  <meta property="og:image" content="https://i.scdn.co/image/cover"/>`;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.startsWith("https://i.scdn.co/")) {
        return new Response(cover, { headers: { "content-type": "image/jpeg" } });
      }
      return new Response(page(url === OTHER ? "Outra" : "Weightless"));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("the profile song", () => {
  it("previews a link: name, artist, the cover as data and its color", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const preview = await rafa.as.action(api.songs.preview, { url: SPOTIFY });
    expect(preview).toMatchObject({
      service: "Spotify",
      title: "Weightless",
      artist: "Marconi Union",
    });
    expect(preview.cover).toMatch(/^data:image\/jpeg;base64,/);
    expect(preview.color).toMatch(/^#[0-9a-f]{6}$/);
    await expect(rafa.as.action(api.songs.preview, { url: "https://example.com" })).rejects.toThrow(
      /Spotify/,
    );
  });

  it("copies the cover into storage on save, keeps it for the same link and swaps it for a new one", async () => {
    const t = newTest();
    const rafa = await reader(t, "rafa");
    const song = { title: "Weightless", artist: "Marconi Union", url: SPOTIFY };
    await rafa.as.mutation(api.users.updateMe, { profileSong: song });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const first = (await rafa.as.query(api.users.me, {})).profileSong;
    expect(first).toMatchObject({ ...song, service: "Spotify" });
    expect(first?.coverUrl).toBeTruthy();
    expect(first?.color).toMatch(/^#[0-9a-f]{6}$/);

    // Fixing the name keeps the cover; a new link replaces it.
    await rafa.as.mutation(api.users.updateMe, { profileSong: { ...song, title: "Weightless!" } });
    expect((await rafa.as.query(api.users.me, {})).profileSong?.coverUrl).toBe(first?.coverUrl);
    await rafa.as.mutation(api.users.updateMe, { profileSong: { ...song, url: OTHER } });
    expect((await rafa.as.query(api.users.me, {})).profileSong?.coverUrl).toBeNull();
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const second = (await rafa.as.query(api.users.me, {})).profileSong;
    expect(second?.coverUrl).toBeTruthy();
    // The old cover was deleted: only the new one is stored.
    expect(await t.run((ctx) => ctx.db.system.query("_storage").collect())).toHaveLength(1);

    // Removing the song removes the stored cover.
    await rafa.as.mutation(api.users.updateMe, { profileSong: null });
    const files = await t.run((ctx) => ctx.db.system.query("_storage").collect());
    expect(files).toHaveLength(0);
  });
});
