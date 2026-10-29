import { CARD_TEMPLATE_LABELS, type CardTemplate } from "@grimo/core";
import { type CardPaletteKey, cardPalettes } from "@grimo/tokens";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BookStack } from "@/components/ui/book-stack";
import { Logo } from "@/components/ui/logo";
import { Sparkle } from "@/components/ui/sparkle";
import { ThemeCycleButton, ThemeToggle } from "@/components/ui/theme-toggle";
import { LegalLinks } from "@/features/legal";
import { type CardData, CardPreview } from "@/features/stats";
import { cn } from "@/utils/cn";
import { DashboardDemo } from "./dashboard-demo";
import { IPhoneDemo } from "./iphone-demo";
import { Bubble, CoverMarquee, Marker, StickyNote } from "./playful";

const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;

/** What a real month card looks like (an example). */
const SAMPLE_MONTH: CardData = {
  kind: "month",
  periodLabel: "outubro de 2026",
  periodName: "outubro",
  previousShort: "set.",
  unit: "mês",
  year: 2026,
  booksRead: 4,
  pagesRead: 1312,
  genre: "Ficção literária",
  goal: { percent: 75, done: 18, target: 24 },
  favorite: {
    title: "A Hora da Estrela",
    authors: ["Clarice Lispector"],
    coverUrl: cover(650866),
    rating: 5,
  },
  books: [
    {
      title: "A Hora da Estrela",
      authors: ["Clarice Lispector"],
      coverUrl: cover(650866),
      rating: 5,
    },
    {
      title: "A Biblioteca da Meia-Noite",
      authors: ["Matt Haig"],
      coverUrl: cover(10313767),
      rating: 4,
    },
    { title: "Watchmen", authors: ["Alan Moore"], coverUrl: cover(7774899), rating: 5 },
    {
      title: "Orgulho e Preconceito",
      authors: ["Jane Austen"],
      coverUrl: cover(14348537),
      rating: 4,
    },
  ],
  deltas: { books: 33, pages: 18 },
  name: "Marina",
  username: "marina",
};

/** Covers for the strip (Open Library). */
const SHELF_COVERS = [650866, 10313767, 7774899, 14348537, 284322, 283860, 8569284, 14627060].map(
  cover,
);

/** Reader confessions: "is this for me?" answered with a smile. */
const CONFESSIONS = [
  "compra livro mais rápido do que lê",
  "está lendo três ao mesmo tempo (e jura que dá conta)",
  "abandonou um livro e ainda sente uma culpinha",
  "precisa urgentemente falar sobre aquele final com alguém",
  "já tentou uma planilha de leituras. durou até março.",
];

const STEPS = [
  {
    title: "Achou o livro",
    body: "Busca por título ou autor, com capa e tudo. Um toque e ele está na estante.",
  },
  {
    title: "Marcou a página",
    body: "“Li mais +10” e pronto. O Grimo faz as contas: ritmo, meta, gênero do ano.",
  },
  {
    title: "Postou o mês",
    body: "No fim do mês o card aparece pronto. Escolhe o visual e manda pros Stories.",
  },
];

/** A made-up feed: what following friends looks like. */
const FEED = [
  {
    initial: "B",
    name: "Bia Lima",
    action: "resenhou",
    book: "Assassinato no Expresso do Oriente",
    body: "Achei que tinha descoberto o culpado na metade… não tinha. Poirot, eu te odeio (te amo).",
    likes: 12,
    comments: 4,
  },
  {
    initial: "C",
    name: "Caio",
    action: "está na página 620 de",
    book: "It: A Coisa",
    body: "1.104 páginas e eu com medo de bueiro de novo.",
    likes: 8,
    comments: 6,
  },
  {
    initial: "L",
    name: "Lu Prado",
    action: "abandonou",
    book: "Hábitos Atômicos",
    body: "Não era pra mim. A estante “Abandonei” existe e eu uso sem culpa.",
    likes: 21,
    comments: 9,
  },
];

const FAQ = [
  {
    q: "Quanto custa?",
    a: "Nada. Guarda o dinheiro pro próximo livro (a gente sabe que vai ter um próximo).",
  },
  {
    q: "Posso abandonar um livro?",
    a: "Pode e deve. Tem até estante pra isso: Abandonei. Zero julgamento por aqui.",
  },
  {
    q: "Preciso postar alguma coisa?",
    a: "Nada. Dá pra usar só como diário. O lado social fica lá esperando quando bater vontade.",
  },
  {
    q: "Dá pra trazer minhas leituras do Skoob ou do Goodreads?",
    a: "Ainda não, mas está na lista. Por enquanto a busca coloca um livro na estante em segundos.",
  },
  {
    q: "Meu perfil é público?",
    a: "Ele abre por link, pra você exibir a estante pros amigos. Seu email fica só com a gente.",
  },
];

/** A card template in a palette, captioned with both names. */
function CardOption({
  data,
  template,
  palette,
  small = false,
}: {
  data: CardData;
  template: CardTemplate;
  palette: CardPaletteKey;
  small?: boolean;
}) {
  return (
    <figure className={cn("flex flex-col items-center gap-2", small && "hidden sm:flex")}>
      <CardPreview
        data={data}
        template={template}
        palette={palette}
        scale={small ? 0.15 : 0.21}
        className="rounded-lg shadow-xl shadow-shadow"
      />
      <figcaption className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {CARD_TEMPLATE_LABELS[template].label} · {cardPalettes[palette].label}
      </figcaption>
    </figure>
  );
}

/** The one action this page asks for, with what it costs right under it. */
function SignUpCta({
  className,
  label = "Abrir meu grimório",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2.5", className)}>
      <Link
        to="/login"
        className="bg-accent-gradient rounded-full px-7 py-4 font-mono text-sm font-medium uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:-rotate-1 hover:opacity-95"
      >
        {label} ✦
      </Link>
      <p className="font-mono text-[11px] text-text-muted">é de graça · leva uns 30 segundos</p>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">{children}</p>
  );
}

/**
 * Public landing page. A reading social network, so it talks like a reader: the product in the
 * hero (dashboard + phone, with friends' notifications floating around), reader confessions,
 * the three gestures, friends' feed, the month card as one look among several, a light FAQ,
 * and the same invitation at the end.
 */
export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-surface text-text">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 lg:px-8">
        <Link to="/welcome" className="flex items-center gap-2.5">
          <Logo className="h-10" />
          <span className="font-serif text-2xl font-bold">Grimo</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
          <span className="sm:hidden">
            <ThemeCycleButton />
          </span>
          <Link
            to="/login"
            className="rounded-full px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero: headline beside the product (real dashboard + phone app), both at the top. */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-6 pb-20 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-8 lg:px-8 lg:pt-10">
          <div className="relative z-10 flex flex-col gap-6">
            <Eyebrow>uma rede social pra quem lê ✦</Eyebrow>
            <h1 className="text-5xl leading-[1.08] font-medium italic xl:text-6xl">
              Conta aí: o que você está <Marker after="?">lendo</Marker>
            </h1>
            <p className="max-w-xl text-lg text-text-muted">
              O Grimo é o cantinho pra guardar suas leituras, espiar a estante dos amigos e postar o
              seu mês nos Stories. Sem planilha e sem julgamento (nem com aquele livro abandonado).
            </p>
            <SignUpCta />
          </div>

          <figure
            aria-label="O Grimo no computador e no celular, com uma leitora de exemplo"
            className="relative md:pb-20 md:pl-36"
          >
            <div inert aria-hidden="true">
              <DashboardDemo className="hidden md:block" />
              <IPhoneDemo
                width={210}
                className="absolute bottom-0 left-0 hidden -rotate-3 md:block"
              />
              <IPhoneDemo width={270} className="mx-auto md:hidden" />
              <StickyNote rotate={4} className="absolute right-10 -bottom-6 hidden lg:block">
                terminei às 3h da manhã. valeu cada minuto de sono perdido.
              </StickyNote>
              <Bubble initial="B" rotate={-2} className="absolute top-1/3 -right-6 hidden md:flex">
                <b>Bia</b> curtiu sua resenha de <i>A Hora da Estrela</i> ♥
              </Bubble>
              <Bubble initial="C" rotate={3} className="absolute top-1/3 -right-3 md:hidden">
                <b>Caio</b> começou a seguir você
              </Bubble>
            </div>
          </figure>
        </section>

        {/* Covers strip */}
        <section aria-label="Capas de livros" className="border-y border-border bg-surface-muted">
          <p className="pt-6 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
            na estante da galera
          </p>
          <CoverMarquee covers={SHELF_COVERS} />
        </section>

        {/* Confessions */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div className="flex flex-col gap-6">
            <Eyebrow>pergunta sincera</Eyebrow>
            <h2 className="text-4xl leading-tight font-medium italic">Você também…</h2>
            <ul className="flex flex-col gap-3">
              {CONFESSIONS.map((line, index) => (
                <li key={line} className="flex items-start gap-3 text-lg">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 grid size-6 shrink-0 place-items-center rounded-md bg-accent text-sm text-accent-foreground",
                      index % 2 ? "rotate-6" : "-rotate-6",
                    )}
                  >
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <p className="font-serif text-2xl italic">
              Então senta aqui, o Grimo foi feito pra <Marker after=".">você</Marker>
            </p>
          </div>
          <BookStack className="justify-self-center lg:mr-16" />
        </section>

        {/* How it works */}
        <section className="bg-surface-muted">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
            <Eyebrow>como funciona</Eyebrow>
            <h2 className="mt-3 text-3xl font-medium italic sm:text-4xl">
              Três toques. O resto é com a gente.
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className={cn(
                    "page flex flex-col gap-3 rounded-xl p-6 transition hover:rotate-0",
                    ["-rotate-1", "rotate-1", "-rotate-[0.5deg]"][index],
                  )}
                >
                  <span className="font-serif text-5xl font-medium italic text-accent">
                    {index + 1}.
                  </span>
                  <h3 className="font-serif text-xl font-medium">{step.title}</h3>
                  <p className="text-sm text-text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Social */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
          <div className="flex flex-col gap-4">
            <Eyebrow>leitura é melhor em grupo</Eyebrow>
            <h2 className="text-3xl leading-tight font-medium italic sm:text-4xl">
              Espie a estante dos amigos (com <Marker after=").">permissão</Marker>
            </h2>
            <p className="text-text-muted">
              Siga quem lê o que você lê, veja em que página cada um parou, curta resenhas e
              comente. Fofoca literária liberada.
            </p>
          </div>
          <ul className="flex flex-col gap-4" inert aria-hidden="true">
            {FEED.map((item, index) => (
              <li
                key={item.name}
                className={cn(
                  "page flex gap-3 rounded-xl p-4",
                  ["rotate-1", "-rotate-1 lg:ml-10", "rotate-[0.5deg] lg:ml-4"][index],
                )}
              >
                <span className="bg-accent-gradient grid size-9 shrink-0 place-items-center rounded-full font-serif font-bold text-accent-foreground">
                  {item.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <b>{item.name}</b> <span className="text-text-muted">{item.action}</span>{" "}
                    <i className="font-serif">{item.book}</i>
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{item.body}</p>
                  <p className="mt-2 flex gap-4 font-mono text-[11px] text-text-muted">
                    <span className="text-accent">♥ {item.likes}</span>
                    <span>{item.comments} comentários</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* The month card: one of several looks the reader can share. */}
        <section className="bg-surface-muted">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
            <div className="flex max-w-xl flex-col gap-4">
              <Eyebrow>card do mês</Eyebrow>
              <h2 className="text-3xl leading-tight font-medium italic sm:text-4xl">
                Seu mês de leitura, pronto pros <Marker after=".">Stories</Marker>
              </h2>
              <p className="text-text-muted">
                Livros, páginas, o gênero do mês e quanto falta pra meta. Escolhe o visual (das
                cores do Grimo ao laranja que grita) entre 4 modelos e 6 paletas, e posta.
              </p>
            </div>
            <div className="flex items-end justify-center gap-4" inert aria-hidden="true">
              <CardOption data={SAMPLE_MONTH} template="estante" palette="lavanda" small />
              <CardOption data={SAMPLE_MONTH} template="diario" palette="noite" />
              <CardOption data={SAMPLE_MONTH} template="fita" palette="brasa" small />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:px-8">
          <div className="flex flex-col gap-3">
            <Eyebrow>perguntas que sempre aparecem</Eyebrow>
            <h2 className="text-3xl font-medium italic sm:text-4xl">Antes de você perguntar</h2>
          </div>
          <dl className="flex flex-col divide-y divide-border">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5 first:pt-0">
                <dt className="font-serif text-lg font-medium">{item.q}</dt>
                <dd className="mt-1.5 text-text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Final invitation */}
        <section className="relative overflow-hidden bg-surface-muted">
          <Sparkle className="absolute top-12 left-[15%] size-5" />
          <Sparkle className="absolute right-[18%] bottom-16 size-4 fill-accent" />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
            <h2 className="text-4xl leading-tight font-medium italic sm:text-5xl">
              E aí, qual livro está na sua <Marker after="?">mesa de cabeceira</Marker>
            </h2>
            <p className="text-text-muted">
              Coloca ele na estante, marca a página e chama os amigos. É assim que começa.
            </p>
            <SignUpCta className="items-center" label="Começar agora" />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 font-mono text-[11px] text-text-muted lg:px-8">
        <span>Grimo ✦ feito por quem lê no ônibus</span>
        <LegalLinks />
        <span>Capas e catálogo: Open Library</span>
      </footer>
    </div>
  );
}
