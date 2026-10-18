/** Curated genre list used for profiles and stats. Keep short — not a catalog. */
export const GENRES = [
  "fantasy",
  "science_fiction",
  "romance",
  "mystery",
  "thriller",
  "horror",
  "literary_fiction",
  "historical_fiction",
  "young_adult",
  "classics",
  "poetry",
  "biography",
  "history",
  "self_help",
  "business",
  "science",
  "philosophy",
  "comics",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRE_LABELS: Record<Genre, string> = {
  fantasy: "Fantasia",
  science_fiction: "Ficção científica",
  romance: "Romance",
  mystery: "Mistério",
  thriller: "Suspense",
  horror: "Terror",
  literary_fiction: "Ficção literária",
  historical_fiction: "Ficção histórica",
  young_adult: "Jovem adulto",
  classics: "Clássicos",
  poetry: "Poesia",
  biography: "Biografia",
  history: "História",
  self_help: "Autoajuda",
  business: "Negócios",
  science: "Ciência",
  philosophy: "Filosofia",
  comics: "Quadrinhos",
};
