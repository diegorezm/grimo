import { type CursorKey, decodeCursor } from "@grimo/core";
import { type SQL, type SQLWrapper, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

/** The cursor's key (null on the first page). A cursor that is not ours is a 400. */
export function readCursor(cursor: string | undefined, length: number): CursorKey | null {
  if (!cursor) return null;
  const key = decodeCursor(cursor, length);
  if (!key) throw new HTTPException(400, { message: "Cursor inválido" });
  return key;
}

/**
 * Keyset condition for an `ORDER BY` that is descending on every column: rows that come after
 * `key`. A row-value comparison, supported by D1 and libSQL alike.
 */
export function before(columns: SQLWrapper[], key: CursorKey | null): SQL | undefined {
  if (!key) return undefined;
  const values = key.map((value) => sql`${value}`);
  return sql`(${sql.join(columns, sql`, `)}) < (${sql.join(values, sql`, `)})`;
}

/** Same as `before`, for an `ORDER BY` that is ascending on every column. */
export function after(columns: SQLWrapper[], key: CursorKey | null): SQL | undefined {
  if (!key) return undefined;
  const values = key.map((value) => sql`${value}`);
  return sql`(${sql.join(columns, sql`, `)}) > (${sql.join(values, sql`, `)})`;
}
