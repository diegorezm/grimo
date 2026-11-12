import { describe, expect, it } from "vitest";
import { isbnFromBarcode } from "./isbn";

describe("isbnFromBarcode", () => {
  it("accepts a book's EAN-13", () => {
    expect(isbnFromBarcode("9788535914849")).toBe("9788535914849");
    expect(isbnFromBarcode("978-0-306-40615-7")).toBe("9780306406157");
  });

  it("refuses other barcodes and wrong check digits", () => {
    expect(isbnFromBarcode("7891000100103")).toBeNull();
    expect(isbnFromBarcode("9788535914840")).toBeNull();
    expect(isbnFromBarcode("978853591484")).toBeNull();
  });
});
