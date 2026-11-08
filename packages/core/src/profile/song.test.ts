import { describe, expect, it } from "vitest";
import { averageColor, parseSongPage, songCardColor } from "./song";

describe("parseSongPage", () => {
  it("reads a Spotify track page", () => {
    const html = `
      <meta property="og:title" content="Weightless"/>
      <meta property="og:description" content="Marconi Union · The Ambient Zone · Song · 2012"/>
      <meta property="og:image" content="https://i.scdn.co/image/abc"/>
      <meta name="music:musician_description" content="Marconi Union"/>`;
    expect(parseSongPage(html)).toEqual({
      title: "Weightless",
      artist: "Marconi Union",
      image: "https://i.scdn.co/image/abc",
    });
  });

  it("splits an Apple Music style title and decodes entities", () => {
    const html = `<meta content="Ela &amp; Eu by Banda &quot;X&quot; on Apple Music" property="og:title">`;
    expect(parseSongPage(html)).toMatchObject({ title: "Ela & Eu", artist: 'Banda "X"' });
  });

  it("gives nulls when the page says nothing", () => {
    expect(parseSongPage("<html></html>")).toEqual({ title: null, artist: null, image: null });
  });
});

describe("song card color", () => {
  it("averages the pixels", () => {
    const pixels = new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]);
    expect(averageColor(pixels, 1)).toEqual({ r: 127.5, g: 0, b: 127.5 });
  });

  it("keeps the hue and darkens for light text", () => {
    expect(songCardColor({ r: 127, g: 167, b: 184 })).toMatch(/^#[0-9a-f]{6}$/);
    // A white cover gives a neutral dark gray, never white.
    expect(songCardColor({ r: 255, g: 255, b: 255 })).toBe("#383838");
  });
});
