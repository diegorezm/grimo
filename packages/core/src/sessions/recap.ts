/** "35 min", "1 h", "1 h 20 min": how long a session took. */
export function formatMinutes(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** A session just saved, for its share card. */
export interface SessionRecap {
  title: string;
  authors: string[];
  coverUrl: string | null;
  minutes: number;
  pages: number;
  /** The session reached the book's last page. */
  lastPage: boolean;
}

/** "38 páginas · 42 min", or just the time when no page was marked. */
export function sessionRecapStats({ minutes, pages }: Pick<SessionRecap, "minutes" | "pages">) {
  const time = formatMinutes(minutes);
  if (pages <= 0) return time;
  return `${pages} ${pages === 1 ? "página" : "páginas"} · ${time}`;
}

/** The ready-to-post text, which the reader can still edit. */
export function sessionShareText(recap: SessionRecap, streakDays: number) {
  const time = formatMinutes(recap.minutes);
  const read =
    recap.pages > 0
      ? `Li ${recap.pages} ${recap.pages === 1 ? "página" : "páginas"} de ${recap.title} em ${time}`
      : `Li ${recap.title} por ${time}`;
  const streak = streakDays > 1 ? `, ${streakDays} dias seguidos lendo` : "";
  return `${read}${streak} 📖 #grimo`;
}
