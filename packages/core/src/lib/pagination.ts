import { z } from "zod";

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type CursorQuery = z.infer<typeof cursorQuerySchema>;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Keyset position: the sort values of the last item, in `ORDER BY` order, ending with a unique
 * tie-breaker (an id) so equal values never skip or repeat rows.
 */
export type CursorKey = (string | number)[];

/** Opaque, URL-safe cursor (base64url of the JSON key). Clients only pass it back. */
export function encodeCursor(key: CursorKey): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(key))) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The key inside a cursor, or null when it is missing or malformed (or has another length). */
export function decodeCursor(cursor: string | undefined, length: number): CursorKey | null {
  if (!cursor) return null;
  try {
    const binary = atob(cursor.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const key: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const valid =
      Array.isArray(key) &&
      key.length === length &&
      key.every((value) => typeof value === "string" || typeof value === "number");
    return valid ? (key as CursorKey) : null;
  } catch {
    return null;
  }
}

/**
 * Turns `limit + 1` fetched rows into a page: the extra row only signals that there is more,
 * and `keyOf` (the last item's sort values) becomes the next cursor.
 */
export function toPage<T>(rows: T[], limit: number, keyOf: (item: T) => CursorKey): Page<T> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > limit && last ? encodeCursor(keyOf(last)) : null };
}
