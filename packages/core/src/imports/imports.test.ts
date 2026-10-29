import { describe, expect, it } from "vitest";
import { goodreadsShelf, importSummary, parseCsv, parseGoodreadsCsv } from "./index";

const HEADER =
  "Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and line breaks", () => {
    expect(parseCsv('a,"b, c","d ""e""\nf"\r\n1,2,3\n')).toEqual([
      ["a", "b, c", 'd "e"\nf'],
      ["1", "2", "3"],
    ]);
  });
});

describe("parseGoodreadsCsv", () => {
  it("reads the Goodreads export", () => {
    const csv = [
      HEADER,
      '1,"Torto Arado",Itamar Vieira Junior,"Junior, Itamar",,"=""8551006754""","=""9788551006751""",5,4.3,Todavia,Paperback,264,2019,2019,2023/05/14,2023/04/01,,,read,"Lindo, demais"',
      '2,Duna,Frank Herbert,"Herbert, Frank",Brian Herbert,"=""""","=""""",0,4.2,Aleph,Paperback,,2017,1965,,2024/01/02,,,currently-reading,',
      "3,,Ninguém,,,,,0,,,,,,,,,,,to-read,",
      "4,Sapiens,Yuval Noah Harari,,,,,0,,,,0,,,,,,,did-not-finish,",
    ].join("\n");
    const result = parseGoodreadsCsv(csv);
    expect(result).toMatchObject({ ok: true, skipped: 1 });
    if (!result.ok) return;
    expect(result.books).toEqual([
      {
        title: "Torto Arado",
        authors: ["Itamar Vieira Junior"],
        isbn13: "9788551006751",
        isbn10: "8551006754",
        status: "read",
        rating: 5,
        finishedAt: Date.UTC(2023, 4, 14, 12),
        pageCount: 264,
      },
      {
        title: "Duna",
        authors: ["Frank Herbert", "Brian Herbert"],
        isbn13: null,
        isbn10: null,
        status: "reading",
        rating: null,
        finishedAt: null,
        pageCount: null,
      },
      expect.objectContaining({ title: "Sapiens", status: "abandoned" }),
    ]);
    expect(importSummary(result.books)).toBe("1 lido, 1 lendo e 1 abandonado");
  });

  it("says when the file isn't a Goodreads export", () => {
    expect(parseGoodreadsCsv("nome,autor\nx,y")).toMatchObject({ ok: false });
  });

  it("maps shelves", () => {
    expect(goodreadsShelf("to-read")).toBe("want_to_read");
    expect(goodreadsShelf("DNF")).toBe("abandoned");
  });
});
