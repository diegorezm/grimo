import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, toPage } from "./pagination";

describe("cursors", () => {
  it("round-trips a key, including non-ASCII text", () => {
    const key = [1760000000000, "ação.leitora", 3];
    const cursor = encodeCursor(key);
    expect(cursor).toMatch(/^[\w-]+$/);
    expect(decodeCursor(cursor, 3)).toEqual(key);
  });

  it("rejects malformed cursors and keys of another length", () => {
    expect(decodeCursor(undefined, 2)).toBeNull();
    expect(decodeCursor("not a cursor!", 2)).toBeNull();
    expect(decodeCursor(encodeCursor([1, "a"]), 3)).toBeNull();
    expect(decodeCursor(encodeCursor([1, "a"]).replace(/./, "{"), 2)).toBeNull();
  });
});

describe("toPage", () => {
  const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("uses the extra row as the signal for a next page", () => {
    const page = toPage(rows, 2, (row) => [row.id]);
    expect(page.items).toEqual([{ id: "a" }, { id: "b" }]);
    expect(decodeCursor(page.nextCursor!, 1)).toEqual(["b"]);
  });

  it("has no next cursor on the last page", () => {
    expect(toPage(rows, 3, (row) => [row.id]).nextCursor).toBeNull();
  });
});
