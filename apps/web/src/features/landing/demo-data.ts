import {
  type FeedItem,
  type FeedPage,
  feedQuery,
  type Me,
  meQuery,
  monthlySummaryQuery,
  type ShelfItem,
  shelfQuery,
  yearOverviewQuery,
} from "@grimo/client";
import { computeMonthlySummary, type ShelfStatus, toMonthKey } from "@grimo/core";
import { QueryClient } from "@tanstack/react-query";
import type { YearOverview } from "@/features/stats";

/**
 * Example reader for the landing page demos. Typed with the real API types: if a response shape
 * changes, this stops compiling instead of showing a broken demo.
 */
const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
/** Demo ids are plain strings; the API types brand them. */
const id = (value: string) => value as never;

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const YEAR = new Date().getUTCFullYear();

type DemoBook = {
  key: string;
  title: string;
  authors: string[];
  cover: number;
  pages: number;
  genre: string;
};

const BOOKS: DemoBook[] = [
  {
    key: "hora",
    title: "A Hora da Estrela",
    authors: ["Clarice Lispector"],
    cover: 650866,
    pages: 88,
    genre: "literary_fiction",
  },
  {
    key: "neuro",
    title: "Neuromancer",
    authors: ["William Gibson"],
    cover: 283860,
    pages: 320,
    genre: "science_fiction",
  },
  {
    key: "anel",
    title: "A Sociedade do Anel",
    authors: ["J. R. R. Tolkien"],
    cover: 14627060,
    pages: 576,
    genre: "fantasy",
  },
  {
    key: "meia",
    title: "A Biblioteca da Meia-Noite",
    authors: ["Matt Haig"],
    cover: 10313767,
    pages: 308,
    genre: "literary_fiction",
  },
  {
    key: "watch",
    title: "Watchmen",
    authors: ["Alan Moore", "Dave Gibbons"],
    cover: 7774899,
    pages: 416,
    genre: "comics",
  },
  {
    key: "orgulho",
    title: "Orgulho e Preconceito",
    authors: ["Jane Austen"],
    cover: 14348537,
    pages: 424,
    genre: "romance",
  },
  {
    key: "count",
    title: "Count Zero",
    authors: ["William Gibson"],
    cover: 284322,
    pages: 256,
    genre: "science_fiction",
  },
  {
    key: "it",
    title: "It: A Coisa",
    authors: ["Stephen King"],
    cover: 8569284,
    pages: 1104,
    genre: "horror",
  },
];

const ENTRIES: {
  book: string;
  status: ShelfStatus;
  page: number;
  rating?: number;
  daysAgo: number;
}[] = [
  { book: "hora", status: "reading", page: 67, daysAgo: 0 },
  { book: "neuro", status: "reading", page: 131, daysAgo: 1 },
  { book: "anel", status: "reading", page: 70, daysAgo: 3 },
  { book: "meia", status: "read", page: 308, rating: 5, daysAgo: 4 },
  { book: "watch", status: "read", page: 416, rating: 5, daysAgo: 9 },
  { book: "orgulho", status: "read", page: 424, rating: 4, daysAgo: 20 },
  { book: "count", status: "want_to_read", page: 0, daysAgo: 6 },
  { book: "it", status: "want_to_read", page: 0, daysAgo: 12 },
];

const bookView = (book: DemoBook) => ({
  id: id(`book-${book.key}`),
  openLibraryId: `demo-${book.key}`,
  title: book.title,
  authors: book.authors,
  coverUrl: cover(book.cover),
  pageCount: book.pages,
  publishedYear: null,
  genres: [book.genre],
});

const SHELF: ShelfItem[] = ENTRIES.map((entry) => {
  const book = BOOKS.find((item) => item.key === entry.book)!;
  const at = NOW - entry.daysAgo * DAY;
  return {
    entry: {
      id: id(`entry-${book.key}`),
      bookId: id(`book-${book.key}`),
      status: entry.status,
      currentPage: entry.page,
      rating: entry.rating ?? null,
      startedAt: entry.status === "want_to_read" ? null : at - 10 * DAY,
      finishedAt: entry.status === "read" ? at : null,
      createdAt: at - 10 * DAY,
      updatedAt: at,
    },
    book: bookView(book),
  };
});

const ME: Me = {
  id: id("user-marina"),
  name: "Marina",
  username: "marina",
  image: null,
  bio: "Lendo no ônibus desde 2009.",
  favoriteGenres: ["literary_fiction", "science_fiction"],
  yearlyGoal: 24,
  followers: 38,
  following: 41,
  timeZone: "America/Sao_Paulo",
  needsSetup: false,
  legal: { needsAcceptance: false, needsAge: false, underage: false },
};

const OVERVIEW: YearOverview = {
  year: YEAR,
  booksRead: 18,
  pagesRead: 6240,
  topGenre: "literary_fiction",
  goal: { target: 24, done: 18 },
};

const friend = (key: string, name: string) => ({
  id: id(`user-${key}`),
  name,
  username: key,
  image: null,
});

const summary = (book: DemoBook) => ({
  id: id(`book-${book.key}`),
  openLibraryId: `demo-${book.key}`,
  title: book.title,
  authors: book.authors,
  coverUrl: cover(book.cover),
});

const post = (key: string, body: string, likes: number, comments: number, likedByMe = false) => ({
  id: id(`post-${key}`),
  kind: "review" as const,
  body,
  rating: 5,
  hasSpoilers: false,
  createdAt: NOW - 2 * 60 * 60 * 1000,
  likeCount: likes,
  commentCount: comments,
  likedByMe,
});

const book = (key: string) => BOOKS.find((item) => item.key === key)!;
const minutes = (value: number) => NOW - value * 60 * 1000;

const FEED_ITEMS: FeedItem[] = [
  {
    id: id("a1"),
    kind: "progress",
    data: { status: "reading", page: 67 },
    createdAt: minutes(12),
    actor: friend("marina", "Marina"),
    target: null,
    book: summary(book("hora")),
    post: null,
  },
  {
    id: id("a2"),
    kind: "posted",
    data: null,
    createdAt: minutes(95),
    actor: friend("bia", "Bia Lima"),
    target: null,
    book: summary(book("meia")),
    post: post(
      "bia",
      "Li num fim de semana. Fiquei pensando em todas as vidas que eu não vivi.",
      12,
      4,
      true,
    ),
  },
  {
    id: id("a3"),
    kind: "progress",
    data: { status: "reading", page: 620 },
    createdAt: minutes(180),
    actor: friend("caio", "Caio"),
    target: null,
    book: summary(book("it")),
    post: null,
  },
  {
    id: id("a4"),
    kind: "finished",
    data: { status: "read", page: 416 },
    createdAt: minutes(60 * 26),
    actor: friend("lu", "Lu Prado"),
    target: null,
    book: summary(book("watch")),
    post: null,
  },
  {
    id: id("a5"),
    kind: "followed",
    data: null,
    createdAt: minutes(60 * 30),
    actor: friend("theo", "Theo"),
    target: { id: id("user-marina"), name: "Marina", username: "marina" },
    book: null,
    post: null,
  },
];

const FEED: FeedPage = { items: FEED_ITEMS, hasMore: false };

function monthSummary(month: string) {
  const finished = SHELF.filter(
    ({ entry }) => entry.finishedAt && toMonthKey(new Date(entry.finishedAt)) === month,
  ).map(({ entry, book }) => ({
    bookId: book.id as string,
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    genres: book.genres,
    rating: entry.rating,
  }));
  return computeMonthlySummary({
    month,
    finished,
    pagesRead: 1312,
    goal: { target: 24, finishedThisYear: 18 },
  });
}

/** Shelves, goal, month and feed of the demo reader, as reading screens expect them. */
export const demoShelf = SHELF;
export const demoMe = ME;
export const demoOverview = OVERVIEW;
export const demoFeed = FEED_ITEMS;

/**
 * A QueryClient that already holds the demo reader's data, under the same keys the real hooks
 * use: real screens render it as is. Never fetches, never persisted, never touches Convex.
 */
export function createDemoQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
        retry: false,
        queryFn: () => new Promise<never>(() => {}),
      },
    },
  });
  const month = toMonthKey(new Date());
  client.setQueryData(shelfQuery().queryKey, { items: SHELF });
  client.setQueryData(meQuery().queryKey, ME);
  client.setQueryData(yearOverviewQuery().queryKey, OVERVIEW);
  client.setQueryData(monthlySummaryQuery(month).queryKey, monthSummary(month));
  client.setQueryData(feedQuery().queryKey, FEED);
  return client;
}
