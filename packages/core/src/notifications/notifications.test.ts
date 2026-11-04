import { describe, expect, it } from "vitest";
import {
  describeNotification,
  extractMentions,
  MAX_MENTIONS,
  splitMentions,
  unreadBadge,
} from "./index";

describe("extractMentions", () => {
  it("finds distinct usernames, lowercased, without the sentence's dot", () => {
    expect(extractMentions("Lendo com @Bia e @rafa.lima. Né, @bia?")).toEqual(["bia", "rafa.lima"]);
  });

  it("ignores emails, short names and doubled @", () => {
    expect(extractMentions("mande para ana@grimo.app, @ab ou @@bia")).toEqual([]);
  });

  it(`stops at ${MAX_MENTIONS}`, () => {
    const text = Array.from({ length: 15 }, (_, i) => `@leitor${i}`).join(" ");
    expect(extractMentions(text)).toHaveLength(MAX_MENTIONS);
  });
});

describe("splitMentions", () => {
  it("cuts the text around each mention, keeping everything else", () => {
    expect(splitMentions("Oi @bia, leu? Fim.")).toEqual([
      { text: "Oi " },
      { text: "@bia", username: "bia" },
      { text: ", leu? Fim." },
    ]);
  });

  it("leaves the trailing dot outside the mention", () => {
    expect(splitMentions("valeu @rafa.")).toEqual([
      { text: "valeu " },
      { text: "@rafa", username: "rafa" },
      { text: "." },
    ]);
  });

  it("returns the text as is without mentions", () => {
    expect(splitMentions("sem nada")).toEqual([{ text: "sem nada" }]);
  });
});

describe("describeNotification", () => {
  it("says what happened to which post", () => {
    expect(describeNotification("follow")).toBe("começou a seguir você");
    expect(describeNotification("like", { postKind: "review" })).toBe("curtiu sua resenha");
    expect(describeNotification("comment", { postKind: "note" })).toBe("comentou na sua nota");
    expect(describeNotification("like", { postKind: "update" })).toBe("curtiu sua atualização");
    expect(describeNotification("report_dismissed")).toMatch(/não encontramos/);
    expect(describeNotification("mention", { inComment: true })).toBe(
      "mencionou você em um comentário",
    );
  });
});

describe("unreadBadge", () => {
  it("caps at 99+", () => {
    expect(unreadBadge(3)).toBe("3");
    expect(unreadBadge(120)).toBe("99+");
  });
});
