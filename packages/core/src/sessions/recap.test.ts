import { describe, expect, it } from "vitest";
import { sessionRecapStats, sessionShareText } from "./recap";

const recap = {
  title: "Duna",
  authors: ["Frank Herbert"],
  coverUrl: null,
  minutes: 42,
  pages: 38,
  lastPage: false,
};

describe("session recap", () => {
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
