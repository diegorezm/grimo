import { shiftDay } from "../lib/date";

/** A session left open longer than this counts only this long (you fell asleep reading). */
export const SESSION_MAX_MS = 6 * 60 * 60 * 1000;

/** "0:42", "12:05", "1:02:05": a running timer. */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** "35 min", "1 h", "1 h 20 min": how long a session took. */
export function formatMinutes(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Whole minutes a session lasted, capped at `SESSION_MAX_MS`. */
export const sessionMinutes = (startedAt: number, endedAt: number) =>
  Math.max(1, Math.round(Math.min(SESSION_MAX_MS, endedAt - startedAt) / 60_000));

export interface Streak {
  /** Days in a row with reading, ending today (or yesterday, while today is still open). */
  days: number;
  readToday: boolean;
}

/**
 * The reading streak ("ofensiva") from the days with reading (`YYYY-MM-DD`, any order and
 * repeated). Not having read yet today doesn't break it: the day isn't over.
 */
export function readingStreak(dayKeys: Iterable<string>, today: string): Streak {
  const days = new Set(dayKeys);
  const readToday = days.has(today);
  let cursor = readToday ? today : shiftDay(today, -1);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { days: count, readToday };
}

/** "1 dia seguido", "5 dias seguidos". */
export const streakLabel = (days: number) =>
  `${days} ${days === 1 ? "dia seguido" : "dias seguidos"}`;
