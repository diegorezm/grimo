import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, avatarProblem } from "./avatar";

describe("avatarProblem", () => {
  it("accepts common photo formats up to the limit", () => {
    expect(avatarProblem({ contentType: "image/jpeg", size: 200_000 })).toBeNull();
    expect(avatarProblem({ contentType: "IMAGE/PNG", size: AVATAR_MAX_BYTES })).toBeNull();
  });

  it("rejects other file types", () => {
    expect(avatarProblem({ contentType: "application/pdf", size: 10 })).toMatch(/JPG/);
    expect(avatarProblem({ contentType: null, size: 10 })).toMatch(/JPG/);
  });

  it("rejects files over the limit", () => {
    expect(avatarProblem({ contentType: "image/webp", size: AVATAR_MAX_BYTES + 1 })).toMatch(
      /5 MB/,
    );
  });
});
