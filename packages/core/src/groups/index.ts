import { z } from "zod";
import { readingPercent } from "../lib/dashboard";
import type { ShelfStatus } from "../shelves/constants";
import { editionPages } from "../shelves/transition";

export * from "./card";

/**
 * Juntos: a few people reading one book together. Progress is compared in percent (editions
 * have different page counts) and the conversation opens up as you read (no spoilers).
 */

/** Small on purpose: a reading group, not a forum. */
export const GROUP_MAX_MEMBERS = 20;
/** Longest message in the conversation. */
export const GROUP_MESSAGE_MAX = 1000;

const DAY = 24 * 60 * 60 * 1000;

/** "Terminar em…": days from today. `null` is "sem data". */
export const FINISH_PRESETS = [
  { days: 14, label: "2 semanas" },
  { days: 30, label: "1 mês" },
  { days: 60, label: "2 meses" },
  { days: 90, label: "3 meses" },
] as const;

/** The finish date for a preset, at the end of that day (epoch ms). */
export function finishByIn(days: number, now: Date): number {
  const date = new Date(now);
  date.setHours(23, 59, 59, 0);
  return date.getTime() + days * DAY;
}

const finishBySchema = z
  .number({ error: "Data inválida" })
  .int("Data inválida")
  .refine((ms) => ms > Date.now(), "Escolha uma data no futuro")
  .refine((ms) => ms < Date.now() + 366 * DAY, "No máximo um ano")
  .nullable();

export const createGroupSchema = z.object({ finishBy: finishBySchema });
export const updateGroupSchema = z.object({ finishBy: finishBySchema });

export const groupMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva alguma coisa")
    .max(GROUP_MESSAGE_MAX, `No máximo ${GROUP_MESSAGE_MAX} caracteres`),
});

/** Invite codes: 8 lowercase letters and digits (no look-alikes). */
export const INVITE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const INVITE_LENGTH = 8;

/** A new invite code from `random` (0–1 numbers, e.g. `crypto.getRandomValues` scaled). */
export function newInviteCode(random: () => number): string {
  let code = "";
  for (let i = 0; i < INVITE_LENGTH; i++) {
    code += INVITE_ALPHABET[Math.floor(random() * INVITE_ALPHABET.length)];
  }
  return code;
}

/** The code in what a reader pasted: the code itself or a link to `/j/<code>`. */
export function parseInviteCode(input: string): string | null {
  const text = input.trim().toLowerCase();
  const match = text.match(/(?:\/j\/)?([a-z0-9]{8})\/?(?:[?#].*)?$/);
  const code = match?.[1];
  if (!code) return null;
  return [...code].every((char) => INVITE_ALPHABET.includes(char)) ? code : null;
}

export const invitePath = (code: string) => `/j/${code}`;

/** How far a member is, 0–100: read is 100, no pages known (or not on the shelf) is 0. */
export function memberPercent(
  entry: { status: ShelfStatus; currentPage: number; pageCount?: number | null } | null,
  bookPages: number | null,
): number {
  if (!entry) return 0;
  if (entry.status === "read") return 100;
  return readingPercent(entry.currentPage, editionPages(entry.pageCount, bookPages)) ?? 0;
}

/** A message is open to whoever has read as far as its author had when writing it. */
export const canSeeMessage = (messagePercent: number, viewerPercent: number) =>
  viewerPercent >= messagePercent;

export interface GroupPace {
  daysLeft: number;
  /** Pages a day (of your edition) to finish on time; null without the page count. */
  pagesPerDay: number | null;
  /** Percent a day, for comparing with the group. */
  percentPerDay: number;
}

/** What it takes to finish by `finishBy`, from where you are. Null without a date or when done. */
export function groupPace(
  finishBy: number | null,
  progress: { percent: number; currentPage: number; pages: number | null },
  now: Date,
): GroupPace | null {
  if (finishBy === null || progress.percent >= 100) return null;
  const daysLeft = Math.max(1, Math.ceil((finishBy - now.getTime()) / DAY));
  const pagesLeft = progress.pages ? Math.max(0, progress.pages - progress.currentPage) : null;
  return {
    daysLeft,
    pagesPerDay: pagesLeft === null ? null : Math.ceil(pagesLeft / daysLeft),
    percentPerDay: Math.ceil((100 - progress.percent) / daysLeft),
  };
}

/** "Faltam 12 dias · 18 páginas por dia". */
export function paceLabel(pace: GroupPace): string {
  const days = pace.daysLeft === 1 ? "Falta 1 dia" : `Faltam ${pace.daysLeft} dias`;
  const rate =
    pace.pagesPerDay !== null
      ? `${pace.pagesPerDay} ${pace.pagesPerDay === 1 ? "página" : "páginas"} por dia`
      : `${pace.percentPerDay}% por dia`;
  return `${days} · ${rate}`;
}

/** The group's progress: the average of its members. */
export const groupPercent = (percents: number[]) =>
  percents.length === 0 ? 0 : Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);

/** "Você e Bia", "Você, Bia e mais 3": who is in the group, you first. */
export function membersLabel(names: string[], includesYou: boolean): string {
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const people = [...(includesYou ? ["Você"] : []), ...names.map(first)];
  if (people.length <= 1) return people[0] ?? "";
  if (people.length === 2) return `${people[0]} e ${people[1]}`;
  return `${people[0]}, ${people[1]} e mais ${people.length - 2}`;
}
