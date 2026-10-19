import { describe, expect, it } from "vitest";
import { USERNAME_REGEX, updateProfileSchema, usernameFromName } from "./schemas";

describe("updateProfileSchema", () => {
  it("trims the name and bio", () => {
    expect(updateProfileSchema.parse({ name: "  Bia ", bio: " oi " })).toEqual({
      name: "Bia",
      bio: "oi",
    });
  });

  it("rejects unknown genres and goals out of range", () => {
    expect(updateProfileSchema.safeParse({ favoriteGenres: ["nope"] }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ yearlyGoal: 0 }).success).toBe(false);
  });
});

describe("usernameFromName", () => {
  it("strips accents and joins words with dots", () => {
    expect(usernameFromName("  Ana Júlia  Prado ")).toBe("ana.julia.prado");
  });

  it("always returns a valid username", () => {
    for (const name of ["", "Zé", "日本語", "O'Brien!!", "a".repeat(80)]) {
      expect(usernameFromName(name)).toMatch(USERNAME_REGEX);
    }
  });
});
