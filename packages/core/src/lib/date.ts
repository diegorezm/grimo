/** Month key in the format `YYYY-MM`. */
export const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function toMonthKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

/** Returns the UTC `[start, end)` range for a `YYYY-MM` key. */
export function monthRange(key: string): { start: Date; end: Date } {
  const [year, month] = key.split("-").map(Number) as [number, number];
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function yearRange(year: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}

/** Moves a `YYYY-MM` key by `delta` months (negative goes back). */
export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number) as [number, number];
  return toMonthKey(new Date(Date.UTC(year, month - 1 + delta, 1)));
}

/** Percent change from `previous` to `current`, rounded; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
