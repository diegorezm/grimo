/**
 * Demo data for `pnpm seed` (convex/seed.ts): readers, books, shelves, progress, ratings,
 * reviews, notes, follows, likes and comments. Titles/authors are ours (pt-BR); Open Library
 * supplies the id, cover and year when it finds the book.
 */
type Status = "want_to_read" | "reading" | "read" | "abandoned";

interface CatalogBook {
  title: string;
  authors: string[];
  query: string;
  genre: string;
  pages: number;
}

/** Titles/authors are ours (pt-BR); Open Library supplies the id, cover and page count. */
export const catalog = {
  duna: {
    title: "Duna",
    authors: ["Frank Herbert"],
    query: "dune frank herbert",
    genre: "science_fiction",
    pages: 680,
  },
  maoEsquerda: {
    title: "A Mão Esquerda da Escuridão",
    authors: ["Ursula K. Le Guin"],
    query: "the left hand of darkness le guin",
    genre: "science_fiction",
    pages: 336,
  },
  nomeDoVento: {
    title: "O Nome do Vento",
    authors: ["Patrick Rothfuss"],
    query: "the name of the wind rothfuss",
    genre: "fantasy",
    pages: 656,
  },
  hobbit: {
    title: "O Hobbit",
    authors: ["J. R. R. Tolkien"],
    query: "the hobbit tolkien",
    genre: "fantasy",
    pages: 336,
  },
  orwell: {
    title: "1984",
    authors: ["George Orwell"],
    query: "nineteen eighty-four orwell",
    genre: "classics",
    pages: 416,
  },
  domCasmurro: {
    title: "Dom Casmurro",
    authors: ["Machado de Assis"],
    query: "dom casmurro machado de assis",
    genre: "classics",
    pages: 256,
  },
  tortoArado: {
    title: "Torto Arado",
    authors: ["Itamar Vieira Junior"],
    query: "torto arado",
    genre: "literary_fiction",
    pages: 264,
  },
  horaDaEstrela: {
    title: "A Hora da Estrela",
    authors: ["Clarice Lispector"],
    query: "a hora da estrela clarice lispector",
    genre: "literary_fiction",
    pages: 88,
  },
  sapiens: {
    title: "Sapiens",
    authors: ["Yuval Noah Harari"],
    query: "sapiens harari",
    genre: "history",
    pages: 472,
  },
  tresCorpos: {
    title: "O Problema dos Três Corpos",
    authors: ["Liu Cixin"],
    query: "the three-body problem liu cixin",
    genre: "science_fiction",
    pages: 320,
  },
  mistborn: {
    title: "Mistborn: O Império Final",
    authors: ["Brandon Sanderson"],
    query: "mistborn the final empire sanderson",
    genre: "fantasy",
    pages: 608,
  },
  hailMary: {
    title: "Projeto Hail Mary",
    authors: ["Andy Weir"],
    query: "project hail mary andy weir",
    genre: "science_fiction",
    pages: 400,
  },
  garotaExemplar: {
    title: "Garota Exemplar",
    authors: ["Gillian Flynn"],
    query: "gone girl gillian flynn",
    genre: "thriller",
    pages: 448,
  },
  expressoOriente: {
    title: "Assassinato no Expresso do Oriente",
    authors: ["Agatha Christie"],
    query: "murder on the orient express christie",
    genre: "mystery",
    pages: 240,
  },
  it: {
    title: "It: A Coisa",
    authors: ["Stephen King"],
    query: "it stephen king",
    genre: "horror",
    pages: 1104,
  },
  habitos: {
    title: "Hábitos Atômicos",
    authors: ["James Clear"],
    query: "atomic habits james clear",
    genre: "self_help",
    pages: 320,
  },
  persepolis: {
    title: "Persépolis",
    authors: ["Marjane Satrapi"],
    query: "persepolis marjane satrapi",
    genre: "comics",
    pages: 352,
  },
  cemAnos: {
    title: "Cem Anos de Solidão",
    authors: ["Gabriel García Márquez"],
    query: "one hundred years of solitude marquez",
    genre: "literary_fiction",
    pages: 448,
  },
  pequenoPrincipe: {
    title: "O Pequeno Príncipe",
    authors: ["Antoine de Saint-Exupéry"],
    query: "le petit prince saint-exupery",
    genre: "classics",
    pages: 96,
  },
  orgulho: {
    title: "Orgulho e Preconceito",
    authors: ["Jane Austen"],
    query: "pride and prejudice jane austen",
    genre: "romance",
    pages: 424,
  },
  neuromancer: {
    title: "Neuromancer",
    authors: ["William Gibson"],
    query: "neuromancer william gibson",
    genre: "science_fiction",
    pages: 320,
  },
  meiaNoite: {
    title: "A Biblioteca da Meia-Noite",
    authors: ["Matt Haig"],
    query: "the midnight library matt haig",
    genre: "literary_fiction",
    pages: 308,
  },
  senhorDosAneis: {
    title: "A Sociedade do Anel",
    authors: ["J. R. R. Tolkien"],
    query: "the fellowship of the ring tolkien",
    genre: "fantasy",
    pages: 576,
  },
  watchmen: {
    title: "Watchmen",
    authors: ["Alan Moore", "Dave Gibbons"],
    query: "watchmen alan moore",
    genre: "comics",
    pages: 416,
  },
} satisfies Record<string, CatalogBook>;

export type BookKey = keyof typeof catalog;

interface ShelfSeed {
  book: BookKey;
  status: Status;
  page?: number;
  rating?: number;
  /** "MM-DD" in the current year. */
  finished?: string;
}

interface PostSeed {
  kind: "review" | "note";
  book?: BookKey;
  rating?: number;
  body: string;
  spoilers?: boolean;
}

export interface ReaderSeed {
  username: string;
  name: string;
  bio: string;
  genres: string[];
  goal: number;
  shelves: ShelfSeed[];
  posts: PostSeed[];
}

/** The first reader is the main demo account. */
export const readers: ReaderSeed[] = [
  {
    username: "rafa",
    name: "Rafa Moreira",
    bio: "Ficção científica no café da manhã, fantasia antes de dormir. Sempre com um livro na mochila.",
    genres: ["science_fiction", "fantasy", "literary_fiction"],
    goal: 24,
    shelves: [
      { book: "duna", status: "reading", page: 312 },
      { book: "maoEsquerda", status: "reading", page: 118 },
      { book: "nomeDoVento", status: "reading", page: 540 },
      { book: "hobbit", status: "read", rating: 5, finished: "01-19" },
      { book: "orwell", status: "read", rating: 4, finished: "02-11" },
      { book: "domCasmurro", status: "read", rating: 4, finished: "03-08" },
      { book: "tortoArado", status: "read", rating: 5, finished: "04-22" },
      { book: "sapiens", status: "read", rating: 3, finished: "05-30" },
      { book: "tresCorpos", status: "read", rating: 4, finished: "06-17" },
      { book: "mistborn", status: "read", rating: 5, finished: "07-26" },
      { book: "hailMary", status: "read", rating: 5, finished: "08-14" },
      { book: "garotaExemplar", status: "read", rating: 4, finished: "09-21" },
      { book: "expressoOriente", status: "read", rating: 4, finished: "10-03" },
      { book: "persepolis", status: "read", rating: 5, finished: "10-12" },
      { book: "habitos", status: "abandoned", page: 74 },
      { book: "cemAnos", status: "want_to_read" },
      { book: "pequenoPrincipe", status: "want_to_read" },
      { book: "orgulho", status: "want_to_read" },
      { book: "neuromancer", status: "want_to_read" },
      { book: "meiaNoite", status: "want_to_read" },
      { book: "horaDaEstrela", status: "want_to_read" },
      { book: "it", status: "want_to_read" },
      { book: "senhorDosAneis", status: "want_to_read" },
      { book: "watchmen", status: "want_to_read" },
    ],
    posts: [
      {
        kind: "review",
        book: "hailMary",
        rating: 5,
        body: "Ri alto, me emocionei e aprendi física sem perceber. O melhor livro que li este ano — e a amizade no centro da história é perfeita.",
      },
      {
        kind: "review",
        book: "tortoArado",
        rating: 5,
        body: "Prosa bonita e dura ao mesmo tempo. Bibiana e Belonísia ficam com você muito depois da última página.",
      },
      {
        kind: "review",
        book: "mistborn",
        rating: 5,
        body: "O sistema de magia mais criativo que já vi. As últimas 100 páginas eu li sem respirar.",
      },
      {
        kind: "note",
        body: "Meta do mês: terminar Duna antes do filme sair do cinema. Alguém topa um clube de leitura?",
      },
    ],
  },
  {
    username: "bia.lima",
    name: "Bia Lima",
    bio: "Clubes do livro, romances de época e mistérios aconchegantes.",
    genres: ["romance", "mystery", "classics"],
    goal: 30,
    shelves: [
      { book: "orgulho", status: "read", rating: 5, finished: "02-02" },
      { book: "expressoOriente", status: "read", rating: 5, finished: "06-10" },
      { book: "meiaNoite", status: "reading", page: 190 },
      { book: "cemAnos", status: "want_to_read" },
      { book: "domCasmurro", status: "read", rating: 4, finished: "09-15" },
    ],
    posts: [
      {
        kind: "review",
        book: "expressoOriente",
        rating: 5,
        body: "Poirot nunca decepciona. Achei que tinha descoberto o culpado na metade… não tinha.",
      },
      {
        kind: "note",
        body: "Montei uma estante só de releituras de fim de ano. Quem mais relê os favoritos em dezembro?",
      },
    ],
  },
  {
    username: "caio",
    name: "Caio Andrade",
    bio: "Quadrinhos, terror e qualquer coisa com naves espaciais.",
    genres: ["comics", "horror", "science_fiction"],
    goal: 20,
    shelves: [
      { book: "watchmen", status: "read", rating: 5, finished: "03-12" },
      { book: "it", status: "reading", page: 620 },
      { book: "neuromancer", status: "read", rating: 4, finished: "08-01" },
      { book: "tresCorpos", status: "abandoned", page: 90 },
      { book: "persepolis", status: "want_to_read" },
    ],
    posts: [
      {
        kind: "review",
        book: "watchmen",
        rating: 5,
        body: "Cada quadro tem um detalhe escondido. Reli duas vezes e ainda achei coisas novas.",
      },
      {
        kind: "note",
        body: "It tem 1.100 páginas e eu tô com medo de palhaço de novo. Página 620 e contando.",
      },
    ],
  },
  {
    username: "lu.prado",
    name: "Lu Prado",
    bio: "Literatura brasileira e latino-americana. Sublinho tudo.",
    genres: ["literary_fiction", "classics", "poetry"],
    goal: 18,
    shelves: [
      { book: "horaDaEstrela", status: "read", rating: 5, finished: "01-28" },
      { book: "tortoArado", status: "read", rating: 5, finished: "05-05" },
      { book: "cemAnos", status: "reading", page: 260 },
      { book: "domCasmurro", status: "read", rating: 5, finished: "07-19" },
    ],
    posts: [
      {
        kind: "review",
        book: "horaDaEstrela",
        rating: 5,
        body: "Curtinho e devastador. Macabéa é uma das personagens mais marcantes da nossa literatura.",
      },
    ],
  },
  {
    username: "theo",
    name: "Theo Santos",
    bio: "Fantasia épica e mapas desenhados à mão.",
    genres: ["fantasy", "young_adult", "history"],
    goal: 15,
    shelves: [
      { book: "senhorDosAneis", status: "reading", page: 410 },
      { book: "hobbit", status: "read", rating: 5, finished: "04-04" },
      { book: "mistborn", status: "read", rating: 4, finished: "09-09" },
      { book: "sapiens", status: "want_to_read" },
      { book: "nomeDoVento", status: "read", rating: 5, finished: "06-23" },
    ],
    posts: [
      {
        kind: "review",
        book: "nomeDoVento",
        rating: 5,
        body: "Kvothe contando a própria história é viciante. Agora é esperar o terceiro livro… para sempre.",
      },
    ],
  },
];

/** Who comments on the main reader's posts (by post index). */
export const comments: { from: string; post: number; body: string }[] = [
  { from: "theo", post: 0, body: "Rocky é o melhor personagem do ano, sem discussão." },
  { from: "caio", post: 0, body: "Tá na minha lista! Depois dessa resenha vai subir pro topo." },
  { from: "lu.prado", post: 1, body: "Que bom que você leu! Itamar escreve demais." },
  { from: "theo", post: 2, body: "Espera até ler O Poço da Ascensão 👀" },
  { from: "bia.lima", post: 3, body: "Eu topo! Podemos marcar um capítulo por semana." },
  { from: "caio", post: 3, body: "Bora. Eu levo o café." },
];
