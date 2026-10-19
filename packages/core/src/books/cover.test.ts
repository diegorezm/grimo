import { describe, expect, it } from "vitest";
import { coverUrl } from "./cover";

describe("coverUrl", () => {
  it("swaps the size of an Open Library cover", () => {
    expect(coverUrl("https://covers.openlibrary.org/b/id/123-L.jpg", "M")).toBe(
      "https://covers.openlibrary.org/b/id/123-M.jpg",
    );
    expect(coverUrl("https://covers.openlibrary.org/b/olid/OL1M-M.jpg", "S")).toBe(
      "https://covers.openlibrary.org/b/olid/OL1M-S.jpg",
    );
  });

  it("leaves other URLs and null alone", () => {
    expect(coverUrl("https://example.com/cover-L.jpg", "M")).toBe(
      "https://example.com/cover-L.jpg",
    );
    expect(coverUrl(null, "M")).toBeNull();
  });
});
