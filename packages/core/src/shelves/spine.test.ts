import { describe, expect, it } from "vitest";
import { SPINE_VARIANTS, spineLook } from "./spine";

describe("spineLook", () => {
  it("is deterministic for the same title", () => {
    expect(spineLook("Dom Casmurro", 256)).toEqual(spineLook("Dom Casmurro", 256));
  });

  it("makes thicker books wider and keeps values in range", () => {
    const thin = spineLook("A", 90);
    const thick = spineLook("A", 900);
    expect(thick.width).toBeGreaterThan(thin.width);
    expect(thin.variant).toBeGreaterThanOrEqual(0);
    expect(thin.variant).toBeLessThan(SPINE_VARIANTS);
  });

  it("falls back when the page count is unknown", () => {
    expect(spineLook("A", null).width).toBe(spineLook("A", 250).width);
  });
});
