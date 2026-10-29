import type { CardBook } from "../stats/card";

/** Rows of readers drawn on the card; the rest become "+N". */
export const GROUP_CARD_MEMBERS = 6;

const DAY = 24 * 60 * 60 * 1000;

export interface GroupCardMember {
  /** First name only: the card is meant to be posted. */
  name: string;
  initial: string;
  percent: number;
}

/** What the Juntos story card shows: the group reading, or "terminamos juntos". */
export interface GroupCardData {
  finished: boolean;
  /** "Lendo juntos" / "Terminamos juntos". */
  headline: string;
  /** "4 leitores · grupo em 45%" / "4 leitores em 23 dias". */
  summary: string;
  book: CardBook;
  members: GroupCardMember[];
  /** Readers beyond `members` ("+2"). */
  more: number;
  groupPercent: number;
  username: string | null;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * The card for a group: everyone finished (2 or more readers) makes it the "terminamos juntos"
 * card; otherwise it shows where each one is.
 */
export function buildGroupCard(
  group: {
    book: Pick<CardBook, "title" | "authors" | "coverUrl">;
    members: { name: string; percent: number }[];
    groupPercent: number;
    createdAt: number;
  },
  username: string | null,
  now: Date,
): GroupCardData {
  const count = group.members.length;
  const finished = count >= 2 && group.members.every((member) => member.percent >= 100);
  const readers = `${count} ${count === 1 ? "leitor" : "leitores"}`;
  const days = Math.max(1, Math.ceil((now.getTime() - group.createdAt) / DAY));
  return {
    finished,
    headline: finished ? "Terminamos juntos" : "Lendo juntos",
    summary: finished
      ? `${readers} em ${days} ${days === 1 ? "dia" : "dias"}`
      : `${readers} · grupo em ${group.groupPercent}%`,
    book: { ...group.book, rating: null },
    members: group.members.slice(0, GROUP_CARD_MEMBERS).map((member) => {
      const name = firstName(member.name);
      return { name, initial: name.slice(0, 1).toUpperCase(), percent: member.percent };
    }),
    more: Math.max(0, count - GROUP_CARD_MEMBERS),
    groupPercent: group.groupPercent,
    username,
  };
}
