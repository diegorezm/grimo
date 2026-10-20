/**
 * Minimum age to have an account. 16 so no account needs to be linked to a guardian (ECA
 * Digital, Lei 15.211/2025, art. 24). See docs/legal/README.md.
 */
export const MIN_AGE = 16;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` → its parts, or null when it isn't a real calendar date. */
export function parseBirthDate(value: string): { year: number; month: number; day: number } | null {
  const match = DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) return null;
  return { year, month, day };
}

/** Full years between a birth date (`YYYY-MM-DD`) and `now` (epoch ms, UTC). */
export function ageOn(birthDate: string, now: number): number | null {
  const birth = parseBirthDate(birthDate);
  if (!birth) return null;
  const today = new Date(now);
  const [year, month, day] = [today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate()];
  const hadBirthday = month > birth.month || (month === birth.month && day >= birth.day);
  return year - birth.year - (hadBirthday ? 0 : 1);
}

export const isOldEnough = (birthDate: string, now: number) =>
  (ageOn(birthDate, now) ?? 0) >= MIN_AGE;

/** What the reader typed on the phone (`DD/MM/AAAA`) → `YYYY-MM-DD`; anything else as is. */
export function birthDateFromBR(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value.trim();
}

/** Formats the digits typed so far as `DD/MM/AAAA`. */
export function maskBirthDate(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
}
