import { z } from "zod";
import type { ShelfStatus } from "../shelves/constants";
import { MAX_CURRENT_PAGE, ratingSchema, shelfStatusSchema } from "../shelves/schemas";

/**
 * Importing a shelf from another app. Goodreads exports a CSV (My Books → Import and export →
 * Export library); the browser reads it here and sends the rows, the server finds each book in
 * Open Library and shelves it.
 */

/** Biggest library one import takes (Goodreads exports everything, even years of "to-read"). */
export const IMPORT_MAX_BOOKS = 3000;

export const importedBookSchema = z.object({
  title: z.string().trim().min(1).max(500),
  authors: z.array(z.string().trim().min(1).max(200)).max(10),
  isbn13: z
    .string()
    .regex(/^\d{13}$/)
    .nullable(),
  isbn10: z
    .string()
    .regex(/^\d{9}[\dX]$/)
    .nullable(),
  status: shelfStatusSchema,
  rating: ratingSchema.nullable(),
  /** When it was finished (epoch ms), for "read". */
  finishedAt: z.number().int().nullable(),
  pageCount: z.number().int().positive().max(MAX_CURRENT_PAGE).nullable(),
});
export type ImportedBook = z.infer<typeof importedBookSchema>;

export const importBooksSchema = z.object({
  books: z
    .array(importedBookSchema)
    .min(1, "O arquivo não tem livros")
    .max(IMPORT_MAX_BOOKS, `No máximo ${IMPORT_MAX_BOOKS} livros por importação`),
});

/** RFC 4180 CSV: commas, quoted fields with "" escapes and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Goodreads writes ISBNs as `="9788535914849"` (so spreadsheets keep the zeros). */
const isbn = (value: string | undefined) => {
  const digits = (value ?? "").replace(/[^\dX]/gi, "").toUpperCase();
  return digits === "" ? null : digits;
};

/** "2023/05/14" → noon UTC that day (no time zone shifts the day). */
function dateMs(value: string | undefined): number | null {
  const match = (value ?? "").trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

/** Goodreads' exclusive shelf → ours. Custom shelves ("did-not-finish"…) are guessed by name. */
export function goodreadsShelf(shelf: string): ShelfStatus {
  const name = shelf.trim().toLowerCase();
  if (name === "read") return "read";
  if (name === "currently-reading") return "reading";
  if (/dnf|did-not-finish|abandon|desist/.test(name)) return "abandoned";
  return "want_to_read";
}

export type GoodreadsParse =
  | { ok: true; books: ImportedBook[]; skipped: number }
  | { ok: false; error: string };

/**
 * Reads a Goodreads library export. Rows that don't make a valid book (no title…) are counted
 * in `skipped`.
 */
export function parseGoodreadsCsv(text: string): GoodreadsParse {
  const [header, ...rows] = parseCsv(text);
  const columns = new Map((header ?? []).map((name, index) => [name.trim(), index]));
  const required = ["Title", "Author", "Exclusive Shelf"];
  if (!required.every((name) => columns.has(name))) {
    return {
      ok: false,
      error:
        "Esse arquivo não parece a exportação do Goodreads (faltam as colunas Title e Author).",
    };
  }
  const cell = (row: string[], name: string) => {
    const index = columns.get(name);
    return index === undefined ? undefined : row[index]?.trim();
  };
  const books: ImportedBook[] = [];
  let skipped = 0;
  for (const row of rows) {
    const status = goodreadsShelf(cell(row, "Exclusive Shelf") ?? "");
    const rating = Number(cell(row, "My Rating") ?? 0);
    const pages = Number(cell(row, "Number of Pages") ?? 0);
    const extra = (cell(row, "Additional Authors") ?? "").split(",").map((name) => name.trim());
    const book = importedBookSchema.safeParse({
      title: cell(row, "Title") ?? "",
      authors: [cell(row, "Author") ?? "", ...extra].filter(Boolean).slice(0, 10),
      isbn13: isbn(cell(row, "ISBN13")),
      isbn10: isbn(cell(row, "ISBN")),
      status,
      rating: rating >= 1 && rating <= 5 ? rating : null,
      finishedAt: status === "read" ? dateMs(cell(row, "Date Read")) : null,
      pageCount: Number.isInteger(pages) && pages > 0 ? Math.min(pages, MAX_CURRENT_PAGE) : null,
    });
    if (book.success) books.push(book.data);
    else skipped++;
  }
  if (books.length === 0) return { ok: false, error: "Não achamos livros nesse arquivo." };
  return { ok: true, books: books.slice(0, IMPORT_MAX_BOOKS), skipped };
}

/** "120 lidos, 3 lendo e 80 em Quero ler" for the confirmation before importing. */
export function importSummary(books: { status: ShelfStatus }[]): string {
  const count = (status: ShelfStatus) => books.filter((book) => book.status === status).length;
  const parts = (
    [
      [count("read"), "lido", "lidos"],
      [count("reading"), "lendo", "lendo"],
      [count("want_to_read"), "em Quero ler", "em Quero ler"],
      [count("abandoned"), "abandonado", "abandonados"],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}`;
}
