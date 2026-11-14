import { describe, expect, it } from "vitest";
import {
  copyName,
  EMPTY_SHELF_FILTER,
  matchesShelfFilter,
  shelfGenres,
  shelfNameSchema,
  toggleFilter,
} from "./filters";

const row = (status: "read" | "reading" | "want_to_read", genres: string[], tagIds: string[]) => ({
  entry: { status, tagIds },
  book: { genres },
});

const shelf = [
  row("read", ["romance"], ["tenho"]),
  row("read", ["fantasy"], ["tenho"]),
  row("want_to_read", ["romance"], []),
  row("reading", ["romance", "fantasy"], ["kindle"]),
];

describe("shelf filters", () => {
  it("shows everything without filters", () => {
    expect(shelf.filter((r) => matchesShelfFilter(r, EMPTY_SHELF_FILTER))).toHaveLength(4);
  });

  it("filters physical books, romances, and physical romances", () => {
    const physical = toggleFilter(EMPTY_SHELF_FILTER, "tagIds", "tenho");
    const romance = toggleFilter(EMPTY_SHELF_FILTER, "genres", "romance");
    const both = toggleFilter(physical, "genres", "romance");
    expect(shelf.filter((r) => matchesShelfFilter(r, physical))).toHaveLength(2);
    expect(shelf.filter((r) => matchesShelfFilter(r, romance))).toHaveLength(3);
    expect(shelf.filter((r) => matchesShelfFilter(r, both))).toEqual([shelf[0]]);
  });

  it("matches any value within a kind, and toggles values off", () => {
    let filter = toggleFilter(EMPTY_SHELF_FILTER, "statuses", "read");
    filter = toggleFilter(filter, "statuses", "reading");
    expect(shelf.filter((r) => matchesShelfFilter(r, filter))).toHaveLength(3);
    expect(toggleFilter(filter, "statuses", "read").statuses).toEqual(["reading"]);
  });

  it("lists the shelf's genres, most common first", () => {
    expect(shelfGenres(shelf)).toEqual(["romance", "fantasy"]);
  });

  it("names shelves and their copies within the limit", () => {
    expect(shelfNameSchema.safeParse("  ").success).toBe(false);
    expect(shelfNameSchema.parse(" Física ")).toBe("Física");
    expect(copyName("Física")).toBe("Física (cópia)");
    expect(copyName("x".repeat(40))).toHaveLength(40);
  });
});
