import type { BookInput } from "@grimo/core";

/**
 * Book search is proxied to Open Library (free, no key) — we only persist books
 * users actually shelve. Swap this module to change the provider.
 */
const SEARCH_URL = "https://openlibrary.org/search.json";
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

export async function searchOpenLibrary(query: string, limit = 20): Promise<BookInput[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, { headers: { "User-Agent": "Grimo/0.1 (reading social app)" } });
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);
  const data = (await res.json()) as { docs: OpenLibraryDoc[] };

  return data.docs.map((doc) => ({
    openLibraryId: doc.key.replace("/works/", ""),
    title: doc.title,
    authors: doc.author_name ?? [],
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    pageCount: doc.number_of_pages_median ?? null,
    publishedYear: doc.first_publish_year ?? null,
    genres: (doc.subject ?? []).slice(0, 5),
  }));
}
