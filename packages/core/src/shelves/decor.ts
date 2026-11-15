import { shiftDay } from "../lib/date";
import type { ShelfDecor } from "./style";

/**
 * The objects on a shelf come alive with reading: every one can be put on the shelf from the
 * start, and each has something it earns (the candle lights, the plant grows…). No currency, no
 * limits: the reading is the reward.
 */

/** Books a year the candle asks for when the reader has no goal set. */
export const DEFAULT_CANDLE_GOAL = 12;
/** The plant grows one size every this many books read, up to `PLANT_MAX_LEVEL`. */
export const PLANT_STEP = 10;
export const PLANT_MAX_LEVEL = 3;
export const GLOBE_GENRES = 5;
export const MUG_STREAK_DAYS = 7;

/** What the reader has done, counted by the backend. */
export interface DecorFacts {
  booksRead: number;
  readThisYear: number;
  /** This year's goal, when the reader set one. */
  goal: number | null;
  /** Different genres among the books read. */
  genresRead: number;
  /** Most days in a row with reading. */
  longestStreak: number;
  reviews: number;
  groups: number;
}

export interface DecorProgress {
  /** 0: as it comes; 1 and up: earned (the plant goes to `PLANT_MAX_LEVEL`). */
  level: number;
  done: number;
  target: number;
  /** What it takes, in the reader's words. */
  hint: string;
  /** What it does once earned. */
  earned: string;
}

export type DecorLevels = Record<ShelfDecor, number>;

export const NO_DECOR_LEVELS: DecorLevels = {
  plant: 0,
  candle: 0,
  frame: 0,
  mug: 0,
  star: 0,
  globe: 0,
};

const once = (done: number, target: number) => (done >= target ? 1 : 0);

/** How far each object is from what it earns. */
export function decorProgress(facts: DecorFacts): Record<ShelfDecor, DecorProgress> {
  const goal = facts.goal ?? DEFAULT_CANDLE_GOAL;
  const plantLevel = Math.min(PLANT_MAX_LEVEL, Math.floor(facts.booksRead / PLANT_STEP));
  return {
    candle: {
      level: once(facts.readThisYear, goal),
      done: Math.min(facts.readThisYear, goal),
      target: goal,
      hint: `Leia ${goal} livros no ano`,
      earned: "Acesa: toque para apagar e acender",
    },
    plant: {
      level: plantLevel,
      done: plantLevel >= PLANT_MAX_LEVEL ? PLANT_STEP : facts.booksRead - plantLevel * PLANT_STEP,
      target: PLANT_STEP,
      hint: `Cresce a cada ${PLANT_STEP} livros lidos`,
      earned: plantLevel >= PLANT_MAX_LEVEL ? "Cresceu tudo o que podia" : "Crescendo",
    },
    globe: {
      level: once(facts.genresRead, GLOBE_GENRES),
      done: Math.min(facts.genresRead, GLOBE_GENRES),
      target: GLOBE_GENRES,
      hint: `Leia livros de ${GLOBE_GENRES} gêneros`,
      earned: "Girando",
    },
    mug: {
      level: once(facts.longestStreak, MUG_STREAK_DAYS),
      done: Math.min(facts.longestStreak, MUG_STREAK_DAYS),
      target: MUG_STREAK_DAYS,
      hint: `Leia ${MUG_STREAK_DAYS} dias seguidos`,
      earned: "Quentinha",
    },
    star: {
      level: once(facts.reviews, 1),
      done: Math.min(facts.reviews, 1),
      target: 1,
      hint: "Escreva sua primeira resenha",
      earned: "Brilhando",
    },
    frame: {
      level: once(facts.groups, 1),
      done: Math.min(facts.groups, 1),
      target: 1,
      hint: "Leia um livro em grupo no Juntos",
      earned: "Com a foto da turma",
    },
  };
}

export function decorLevelsOf(facts: DecorFacts): DecorLevels {
  const progress = decorProgress(facts);
  return {
    plant: progress.plant.level,
    candle: progress.candle.level,
    frame: progress.frame.level,
    mug: progress.mug.level,
    star: progress.star.level,
    globe: progress.globe.level,
  };
}

/** Most days in a row among these day keys (`YYYY-MM-DD`, any order and repeated). */
export function longestStreak(dayKeys: Iterable<string>): number {
  const days = new Set(dayKeys);
  let best = 0;
  for (const day of days) {
    // Only count from the first day of each run.
    if (days.has(shiftDay(day, -1))) continue;
    let run = 1;
    let cursor = shiftDay(day, 1);
    while (days.has(cursor)) {
      run += 1;
      cursor = shiftDay(cursor, 1);
    }
    best = Math.max(best, run);
  }
  return best;
}

/** Days after finishing a book that it still shines on the shelf. */
export const JUST_READ_DAYS = 7;

/** Whether a book finished at `finishedAt` (epoch ms) still shines at `now`. */
export const isJustRead = (finishedAt: number | null | undefined, now: number) =>
  typeof finishedAt === "number" &&
  finishedAt <= now &&
  now - finishedAt < JUST_READ_DAYS * 24 * 60 * 60 * 1000;

/** How far into a book, 0..1 (0 when the pages aren't known). */
export const readingProgress = (currentPage: number, pageCount: number | null | undefined) =>
  pageCount && pageCount > 0 ? Math.min(1, Math.max(0, currentPage / pageCount)) : 0;
