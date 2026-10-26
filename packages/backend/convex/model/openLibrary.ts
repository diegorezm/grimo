import { type BookInput, cleanDescription } from "@grimo/core";

/**
 * Book search is proxied to Open Library (free, no key) — we only persist books
 * users actually shelve. Swap this module to change the provider. Runs in actions only.
 */
const SEARCH_URL = "https://openlibrary.org/search.json";
const HEADERS = { "User-Agent": "Grimo/0.1 (reading social app)" };
const FIELDS = "key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject";

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
}

const searchUrl = (query: string, limit: number) => {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(limit));
  return url;
};

const toBookInput = (doc: OpenLibraryDoc): BookInput => ({
  openLibraryId: doc.key.replace("/works/", ""),
  title: doc.title,
  authors: doc.author_name ?? [],
  coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
  pageCount: doc.number_of_pages_median ?? null,
  publishedYear: doc.first_publish_year ?? null,
  genres: (doc.subject ?? []).slice(0, 5),
});

export async function searchOpenLibrary(query: string, limit = 20): Promise<BookInput[]> {
  const res = await fetch(searchUrl(query, limit), {
    headers: HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);
  const data = (await res.json()) as { docs: OpenLibraryDoc[] };
  return data.docs.map(toBookInput);
}

/**
 * One book as Open Library's search knows it (same fields as `searchOpenLibrary`). `null` when
 * Open Library doesn't know the id, `undefined` when it couldn't be reached.
 */
export async function fetchBook(openLibraryId: string): Promise<BookInput | null | undefined> {
  try {
    const res = await fetch(searchUrl(`key:/works/${openLibraryId}`, 1), {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { docs: OpenLibraryDoc[] };
    const doc = data.docs.find((item) => item.key === `/works/${openLibraryId}`);
    return doc ? toBookInput(doc) : null;
  } catch {
    return undefined;
  }
}

interface OpenLibraryWork {
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author?: { key?: string } }[];
}

export interface WorkDetails {
  title: string | null;
  description: string | null;
  coverUrl: string | null;
  genres: string[];
  publishedYear: number | null;
  authors: string[];
}

/**
 * Work page from Open Library (synopsis, cover, authors). `null` when Open Library doesn't know
 * the id, `undefined` when it couldn't be reached (try again later).
 */
export async function fetchWork(openLibraryId: string): Promise<WorkDetails | null | undefined> {
  if (!/^OL\d+W$/.test(openLibraryId)) return null;
  try {
    const res = await fetch(`https://openlibrary.org/works/${openLibraryId}.json`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const work = (await res.json()) as OpenLibraryWork;
    const authorKeys = (work.authors ?? [])
      .map((a) => a.author?.key)
      .filter((key): key is string => Boolean(key))
      .slice(0, 3);
    const authors = await Promise.all(
      authorKeys.map(async (key) => {
        const r = await fetch(`https://openlibrary.org${key}.json`, {
          headers: HEADERS,
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        if (!r?.ok) return null;
        return ((await r.json()) as { name?: string }).name ?? null;
      }),
    );
    const raw =
      typeof work.description === "string" ? work.description : (work.description?.value ?? null);
    const description = raw ? cleanDescription(raw) : null;
    const year = work.first_publish_date?.match(/\d{4}/)?.[0];
    const cover = work.covers?.find((id) => id > 0);
    return {
      title: work.title ?? null,
      description: description || null,
      coverUrl: cover ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg` : null,
      genres: (work.subjects ?? []).slice(0, 5),
      publishedYear: year ? Number(year) : null,
      authors: authors.filter((name): name is string => Boolean(name)),
    };
  } catch {
    return undefined;
  }
}
