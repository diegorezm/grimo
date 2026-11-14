import { describe, expect, it } from "vitest";
import { checkoutRequestSchema, formatPrice, isPlanActive, SHOP_ITEMS } from "./catalog";

describe("billing catalog", () => {
  it("accepts a plan or a known item, nothing else", () => {
    expect(checkoutRequestSchema.safeParse({ kind: "plan", interval: "yearly" }).success).toBe(
      true,
    );
    expect(checkoutRequestSchema.safeParse({ kind: "plan", interval: "weekly" }).success).toBe(
      false,
    );
    expect(checkoutRequestSchema.safeParse({ kind: "item", key: "estante-exemplo" }).success).toBe(
      true,
    );
    expect(checkoutRequestSchema.safeParse({ kind: "item", key: "nope" }).success).toBe(false);
  });

  it("gives the plan while paid or in grace", () => {
    for (const status of ["active", "trialing", "past_due"])
      expect(isPlanActive(status)).toBe(true);
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(isPlanActive(status)).toBe(false);
    }
  });

  it("has unique lookup keys", () => {
    const keys = Object.values(SHOP_ITEMS).map((item) => item.lookupKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("formats cents as reais", () => {
    expect(formatPrice(1490).replace(/\s/g, " ")).toBe("R$ 14,90");
  });
});
