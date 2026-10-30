/** Month key in the format `YYYY-MM`. */
export const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Where a reader is until their device says otherwise (the app's audience is Brazilian). */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

/** Whether `timeZone` is an IANA zone this runtime knows (`America/Sao_Paulo`, `UTC`…). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The device's time zone (what the apps send to the server). */
export const deviceTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** The calendar fields `date` has on the wall clock of `timeZone` (device zone when omitted). */
function zonedParts(date: Date, timeZone?: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const field = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: field("year"),
    month: field("month"),
    day: field("day"),
    hour: field("hour"),
    minute: field("minute"),
    second: field("second"),
  };
}

/** The year it is on the wall clock of `timeZone` (device zone when omitted). */
export const yearOf = (date: Date, timeZone?: string): number => zonedParts(date, timeZone).year;

/** Day key (`YYYY-MM-DD`) of `date` on the wall clock of `timeZone` (device zone when omitted). */
export function toDayKey(date: Date, timeZone?: string): string {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The day key `delta` days from `key` (calendar days, no time zone involved). */
export function shiftDay(key: string, delta: number): string {
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

/** Month key (`YYYY-MM`) of `date` on the wall clock of `timeZone` (device zone when omitted). */
export function toMonthKey(date: Date, timeZone?: string): string {
  const { year, month } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The instant the wall clock of `timeZone` reads midnight of `year`-`month`-01 (month 1-12). */
function startOfMonth(year: number, month: number, timeZone: string): Date {
  const wallAsUtc = Date.UTC(year, month - 1, 1);
  // Offset of the zone at a given instant: what its wall clock reads, as UTC, minus the instant.
  const offsetAt = (instant: number) => {
    const p = zonedParts(new Date(instant), timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant;
  };
  // Second pass settles zones whose offset changes (DST) between the guess and the real instant.
  const first = wallAsUtc - offsetAt(wallAsUtc);
  return new Date(wallAsUtc - offsetAt(first));
}

/** Returns the `[start, end)` instants of a `YYYY-MM` key in `timeZone` (UTC when omitted). */
export function monthRange(key: string, timeZone = "UTC"): { start: Date; end: Date } {
  const [year, month] = key.split("-").map(Number) as [number, number];
  return {
    start: startOfMonth(year, month, timeZone),
    end: startOfMonth(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, timeZone),
  };
}

export function yearRange(year: number, timeZone = "UTC"): { start: Date; end: Date } {
  return { start: startOfMonth(year, 1, timeZone), end: startOfMonth(year + 1, 1, timeZone) };
}

/** Moves a `YYYY-MM` key by `delta` months (negative goes back). */
export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number) as [number, number];
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Percent change from `previous` to `current`, rounded; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
