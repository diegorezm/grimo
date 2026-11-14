import { describe, expect, it } from "vitest";
import { musicService } from "./personalize";
import { updateProfileSchema } from "./schemas";

describe("musicService", () => {
  it("names the music services a song link may come from", () => {
    expect(musicService("https://open.spotify.com/track/abc")).toBe("Spotify");
    expect(musicService("https://music.apple.com/br/album/x")).toBe("Apple Music");
    expect(musicService("https://youtu.be/xyz")).toBe("YouTube");
  });

  it("refuses other sites and plain http", () => {
    expect(musicService("https://example.com/song")).toBeNull();
    expect(musicService("http://open.spotify.com/track/abc")).toBeNull();
    expect(musicService("não é link")).toBeNull();
  });
});

describe("profile personalization", () => {
  it("takes a song, pronouns and up to four favorite books", () => {
    const parsed = updateProfileSchema.parse({
      pronouns: "  ela/dela ",
      profileColor: "rose",
      profileSong: {
        title: "Clair de Lune",
        artist: "Debussy",
        url: "https://open.spotify.com/track/abc",
      },
      favoriteBookIds: ["a", "b", "c", "d"],
    });
    expect(parsed.pronouns).toBe("ela/dela");
    expect(parsed.profileSong?.artist).toBe("Debussy");
  });

  it("clears empty pronouns and refuses bad songs, colors and lists", () => {
    expect(updateProfileSchema.parse({ pronouns: "  " }).pronouns).toBeNull();
    const song = { title: "x", artist: "y", url: "https://example.com" };
    expect(updateProfileSchema.safeParse({ profileSong: song }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ profileColor: "neon" }).success).toBe(false);
    expect(
      updateProfileSchema.safeParse({ favoriteBookIds: ["a", "b", "c", "d", "e"] }).success,
    ).toBe(false);
    expect(updateProfileSchema.safeParse({ favoriteBookIds: ["a", "a"] }).success).toBe(false);
  });
});
