import { describe, expect, it } from "vitest";
import { BOOKCASE_COLORS, DEFAULT_BOOKCASE_COLOR, isBookcaseColor } from "./view";

describe("bookcase colors", () => {
  it("accepts only the listed colors", () => {
    expect(BOOKCASE_COLORS.every(isBookcaseColor)).toBe(true);
    expect(isBookcaseColor("white")).toBe(false);
    expect(isBookcaseColor(undefined)).toBe(false);
  });

  it("starts lilac and never offers white", () => {
    expect(DEFAULT_BOOKCASE_COLOR).toBe("lilac");
    expect(BOOKCASE_COLORS).not.toContain("white");
  });
});
