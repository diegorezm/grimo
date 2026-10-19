import { describe, expect, it } from "vitest";
import { searchReadersSchema } from "./schemas";

describe("searchReadersSchema", () => {
  it("trims the query", () => {
    expect(searchReadersSchema.parse({ q: "  bia " })).toEqual({ q: "bia", limit: 20 });
  });

  it("rejects an empty query", () => {
    expect(searchReadersSchema.safeParse({ q: "   " }).success).toBe(false);
  });
});
