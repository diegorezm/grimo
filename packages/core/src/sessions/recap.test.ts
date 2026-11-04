import { describe, expect, it } from "vitest";
import { buildSessionRecap, sessionRecapStats, sessionShareText, xPostUrl } from "./recap";

const recap = {
  title: "Duna",
  authors: ["Frank Herbert"],
  coverUrl: null,
  minutes: 42,
  pages: 38,
  lastPage: false,
};

describe("session recap", () => {
  it("builds the recap from the finished session", () => {
    const session = {
      book: { title: "Duna", authors: [], coverUrl: null },
      startPage: 10,
      pageCount: 50,
    };
    expect(buildSessionRecap(session, 50, 90_000)).toMatchObject({
      minutes: 2,
      pages: 40,
      lastPage: true,
    });
    expect(buildSessionRecap(session, 5, 0)).toMatchObject({
      minutes: 1,
      pages: 0,
      lastPage: false,
    });
  });

  it("links to the post with the text", () => {
    expect(xPostUrl("a b")).toBe("https://x.com/intent/post?text=a%20b");
  });

  it("sums up the session", () => {
    expect(sessionRecapStats(recap)).toBe("38 páginas · 42 min");
    expect(sessionRecapStats({ minutes: 42, pages: 1 })).toBe("1 página · 42 min");
    expect(sessionRecapStats({ minutes: 42, pages: 0 })).toBe("42 min");
  });

  it("writes the post, with the streak only when there is one", () => {
    expect(sessionShareText(recap, 5)).toBe(
      "Li 38 páginas de Duna em 42 min, 5 dias seguidos lendo 📖 #grimo",
    );
    expect(sessionShareText({ ...recap, pages: 0 }, 1)).toBe("Li Duna por 42 min 📖 #grimo");
  });
});
