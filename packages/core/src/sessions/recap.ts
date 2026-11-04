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

/** The image sizes of the share card. */
export const SESSION_SHARE_FORMATS = {
  story: { label: "Stories", width: 1080, height: 1920 },
  square: { label: "Quadrado", width: 1080, height: 1080 },
} as const;
export type SessionShareFormat = keyof typeof SESSION_SHARE_FORMATS;

/** The X post link with the text ready (it can't attach images). */
export const xPostUrl = (text: string) =>
  `https://x.com/intent/post?text=${encodeURIComponent(text)}`;

/** The session just finished at `page`, ready for its card. */
export function buildSessionRecap(
  session: {
    book: { title: string; authors: string[]; coverUrl: string | null };
    startPage: number;
    pageCount: number | null;
  },
  page: number,
  readingMs: number,
): SessionRecap {
  return {
    title: session.book.title,
    authors: session.book.authors,
    coverUrl: session.book.coverUrl,
    minutes: Math.max(1, Math.round(readingMs / 60_000)),
    pages: Math.max(0, page - session.startPage),
    lastPage: session.pageCount !== null && page >= session.pageCount,
  };
}
