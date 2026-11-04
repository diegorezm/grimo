/** Shown when the community hasn't read enough yet to suggest authors. */
const DEFAULT_SEARCH_SUGGESTIONS = [
  "Clarice Lispector",
  "Machado de Assis",
  "Brandon Sanderson",
  "Ursula K. Le Guin",
  "Agatha Christie",
  "Frank Herbert",
];
const SEARCH_SUGGESTIONS = 6;

/** What to offer under an empty search: authors read now first, then the defaults, no repeats. */
export function searchSuggestions(trendingAuthors: string[]): string[] {
  const seen = new Set<string>();
  return [...trendingAuthors, ...DEFAULT_SEARCH_SUGGESTIONS]
    .filter((name) => {
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, SEARCH_SUGGESTIONS);
}

/** "1 leitor este mês", "12 leitores este mês". */
export const popularReadersLabel = (readers: number) =>
  `${readers} ${readers === 1 ? "leitor" : "leitores"} este mês`;

/** The filters of the book search, as Open Library files its subjects. */
export const SEARCH_GENRES = [
  { id: "fantasy", label: "Fantasia", subject: "fantasy" },
  { id: "science_fiction", label: "Ficção científica", subject: "science fiction" },
  { id: "romance", label: "Romance", subject: "romance" },
  { id: "humor", label: "Humor", subject: "humor" },
  { id: "mystery", label: "Mistério", subject: "mystery" },
  { id: "thriller", label: "Suspense", subject: "thriller" },
  { id: "horror", label: "Terror", subject: "horror" },
  { id: "literary_fiction", label: "Ficção literária", subject: "literary fiction" },
  { id: "historical_fiction", label: "Ficção histórica", subject: "historical fiction" },
  { id: "young_adult", label: "Jovem adulto", subject: "young adult fiction" },
  { id: "classics", label: "Clássicos", subject: "classics" },
  { id: "poetry", label: "Poesia", subject: "poetry" },
  { id: "biography", label: "Biografia", subject: "biography" },
  { id: "history", label: "História", subject: "history" },
  { id: "self_help", label: "Autoajuda", subject: "self-help" },
  { id: "business", label: "Negócios", subject: "business" },
  { id: "science", label: "Ciência", subject: "science" },
  { id: "philosophy", label: "Filosofia", subject: "philosophy" },
  { id: "comics", label: "Quadrinhos", subject: "comics" },
] as const;

export type SearchGenre = (typeof SEARCH_GENRES)[number]["id"];

/** What to ask the search for: the typed text, narrowed to a genre (a genre alone also browses). */
export function bookSearchTerm(text: string, genre: SearchGenre | null): string {
  const typed = text.trim();
  const subject = SEARCH_GENRES.find((option) => option.id === genre)?.subject;
  return subject ? `${typed} subject:"${subject}"`.trim() : typed;
}
