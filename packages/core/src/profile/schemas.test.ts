import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./schemas";

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
