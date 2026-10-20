import {
  type AgreementInput,
  type BookSearchResult,
  errorMessage,
  useAddToShelf,
  useBookSearch,
  useCompleteSetup,
  useMe,
  useUpdateMe,
  useUpdateShelfEntry,
  useUsernameAvailable,
} from "@grimo/client";
import {
  firstIssue,
  legalAcceptanceSchema,
  PRIVACY_VERSION,
  setupProfileSchema,
  TERMS_VERSION,
  usernameFromName,
} from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useDeferredValue, useState } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { Sparkle } from "@/components/ui/sparkle";
import { BookCover } from "@/features/books";
import { AgreementFields, UnderageNotice } from "@/features/legal";
import { cn } from "@/utils/cn";

type Step = "profile" | "book" | "page" | "goal" | "done";

const YEAR = new Date().getFullYear();
const GOALS = [6, 12, 24, 52];
/** Pre-selected: what most readers pick (default effect), changeable in one tap. */
const DEFAULT_GOAL = 12;
const SUGGESTIONS = ["Torto Arado", "Clarice Lispector", "Duna", "Agatha Christie", "Sapiens"];

/**
 * First run, right after sign-up. A new account first says how it appears to others (name,
 * prefilled from Google when it came from there, and @). Then, instead of a tour, the reader
 * does the thing the product is for: puts the book they're reading on the shelf and marks the
 * page (activation), then commits to a yearly goal (with a sensible default). Progress starts
 * with the account already done, and the last screen celebrates instead of just confirming.
 */
export function OnboardingFlow() {
  const me = useMe();
  const [chosen, setStep] = useState<Step | null>(null);
  // Accounts that already have name and @ (e.g. coming from "Primeiros passos") skip that step.
  const step = chosen ?? (me.data ? (me.data.needsSetup ? "profile" : "book") : null);
  const [book, setBook] = useState<{ entryId: string; info: BookSearchResult } | null>(null);
  const [page, setPage] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-5">
        <Logo className="h-9" />
        {step !== "done" && step !== "profile" && (
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
          >
            Pular por agora
          </Link>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pt-4 pb-16">
        {step === null && <Spinner />}
        {step && !me.data?.legal.underage && <Progress step={step} />}
        {me.data?.legal.underage && <UnderageNotice />}
        {step === "profile" && me.data && !me.data.legal.underage && (
          <ProfileStep
            initialName={me.data.name}
            initialUsername={me.data.name ? me.data.username : ""}
            onDone={() => setStep("book")}
          />
        )}
        {step === "book" && (
          <BookStep
            onPicked={(entryId, info) => {
              setBook({ entryId, info });
              setStep("page");
            }}
            onSkip={() => setStep("goal")}
          />
        )}
        {step === "page" && book && (
          <PageStep
            entryId={book.entryId}
            book={book.info}
            onDone={(value) => {
              setPage(value);
              setStep("goal");
            }}
          />
        )}
        {step === "goal" && (
          <GoalStep
            onDone={(value) => {
              setGoal(value);
              setStep("done");
            }}
          />
        )}
        {step === "done" && <DoneStep book={book?.info ?? null} page={page} goal={goal} />}
      </main>
    </div>
  );
}

/** "Conta criada" is already checked: nobody starts at zero. */
function Progress({ step }: { step: Step }) {
  const order: Step[] = ["profile", "book", "page", "goal", "done"];
  const current = order.indexOf(step);
  const items = [
    { label: "Conta criada", done: true },
    { label: "Seu perfil", done: current > 0 },
    { label: "Livro de agora", done: current > 2 },
    { label: "Meta do ano", done: current > 3 },
  ];
  const percent = Math.round(((current + 1) / (order.length + 1)) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="h-1.5 rounded-full bg-surface-muted">
        <div
          className="bg-accent-gradient h-full rounded-full transition-[width] duration-500"
          style={{ width: `${step === "done" ? 100 : percent}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
        {items.map((item) => (
          <li key={item.label} className={item.done ? "text-accent" : "text-text-muted"}>
            {item.done ? "✓ " : ""}
            {item.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl leading-tight font-medium italic sm:text-5xl">{title}</h1>
      <p className="text-text-muted">{subtitle}</p>
    </div>
  );
}

/**
 * Name and @, validated with the core `setupProfileSchema` (same rules as the server). The @
 * follows the name until edited, and says right away whether it's free.
 */
function ProfileStep({
  initialName,
  initialUsername,
  onDone,
}: {
  initialName: string;
  initialUsername: string;
  onDone: () => void;
}) {
  const completeSetup = useCompleteSetup("web");
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState<string | null>(initialUsername || null);
  const [agreement, setAgreement] = useState<AgreementInput>({ accepted: false });
  const handle = username ?? usernameFromName(name);
  const checked = useUsernameAvailable(useDeferredValue(handle));
  const taken = checked.data?.valid && !checked.data.available;
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = setupProfileSchema.safeParse({ name, username: handle });
    if (!input.success) return setError(firstIssue(input.error));
    if (taken) return setError("Esse @ já tem dono. Que tal outro?");
    const legal = legalAcceptanceSchema.safeParse({
      ...agreement,
      birthDate: agreement.birthDate ?? "",
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
    if (!legal.success) return setError(firstIssue(legal.error));
    setError(null);
    completeSetup.mutate(
      { ...input.data, ...agreement },
      {
        // Under 16 the cached `me` turns `legal.underage` and the step shows the way out.
        onSuccess: (result) => result.ok && onDone(),
        onError: (failure) => setError(errorMessage(failure)),
      },
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <Heading
        title="Como você quer aparecer por aqui?"
        subtitle="Seu nome e o @ que os amigos vão usar pra te achar. Dá pra mudar o nome depois."
      />
      <form onSubmit={submit} noValidate className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Nome
          </span>
          <input
            // biome-ignore lint/a11y/noAutofocus: the first thing to fill on this step
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            className="rounded-md border border-border bg-surface px-3.5 py-3 text-lg outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Seu @
          </span>
          <span className="flex items-center rounded-md border border-border bg-surface pl-3.5 focus-within:border-accent">
            <span className="font-mono text-text-muted">@</span>
            <input
              value={handle}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/^@/, ""))}
              placeholder="usuario"
              autoCapitalize="none"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent py-3 pr-3.5 pl-1 font-mono outline-none placeholder:text-text-muted"
            />
          </span>
          <span
            aria-live="polite"
            className={cn(
              "min-h-4 font-mono text-[11px]",
              taken ? "text-danger" : "text-text-muted",
            )}
          >
            {handle.length >= 3 && checked.data
              ? !checked.data.valid
                ? "Use 3 a 30 letras minúsculas, números, ponto ou _"
                : taken
                  ? "Esse @ já tem dono"
                  : "Disponível ✦"
              : ""}
          </span>
        </label>
        <AgreementFields value={agreement} onChange={setAgreement} askAge />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={completeSetup.isPending} className="self-start py-3.5">
          {completeSetup.isPending ? "Salvando…" : "É assim que eu sou"}
        </Button>
      </form>
    </section>
  );
}

function BookStep({
  onPicked,
  onSkip,
}: {
  onPicked: (entryId: string, book: BookSearchResult) => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const search = useBookSearch(deferred);
  const addToShelf = useAddToShelf();
  const results = (search.data?.items ?? []).slice(0, 8);

  function pick(book: BookSearchResult) {
    addToShelf.mutate(
      { book, status: "reading" },
      { onSuccess: ({ entry }) => onPicked(entry.id, book) },
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Heading
        title="Qual livro você está lendo agora?"
        subtitle="Ele vai para a estante “Lendo”. Daqui a pouco você marca a página."
      />
      <label className="flex items-center gap-3 rounded-full bg-surface-muted px-5 py-3.5 focus-within:ring-2 focus-within:ring-accent/40">
        <SearchIcon className="text-text-muted" />
        <input
          // biome-ignore lint/a11y/noAutofocus: the only thing to do on this step
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título ou autor"
          aria-label="Buscar o livro que você está lendo"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
        />
      </label>
      {query.trim().length < 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Experimente:
          </span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-full border border-border px-3.5 py-1 text-sm transition hover:bg-surface-muted"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {search.isFetching && results.length === 0 && <Spinner label="Buscando…" />}
      {results.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {results.map((book) => (
            <li key={book.openLibraryId} className="flex items-center gap-4 p-3">
              <BookCover src={book.coverUrl} title={book.title} className="w-12" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif font-medium">{book.title}</p>
                <p className="truncate text-sm text-text-muted">
                  {book.authors.join(", ")}
                  {book.publishedYear ? ` · ${book.publishedYear}` : ""}
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={addToShelf.isPending}
                onClick={() => pick(book)}
                aria-label={`Estou lendo ${book.title}`}
              >
                Estou lendo
              </Button>
            </li>
          ))}
        </ul>
      )}
      {addToShelf.isError && (
        <p className="text-sm text-danger">{errorMessage(addToShelf.error)}</p>
      )}
      <button
        type="button"
        onClick={onSkip}
        className="self-start text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
      >
        Não estou lendo nada agora
      </button>
    </section>
  );
}

function PageStep({
  entryId,
  book,
  onDone,
}: {
  entryId: string;
  book: BookSearchResult;
  onDone: (page: number | null) => void;
}) {
  const update = useUpdateShelfEntry();
  const [value, setValue] = useState("");
  const page = Number.parseInt(value, 10);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(page) || page <= 0) return onDone(null);
    update.mutate({ id: entryId, currentPage: page }, { onSuccess: () => onDone(page) });
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center gap-5">
        <BookCover
          src={book.coverUrl}
          title={book.title}
          className="w-20 shadow-md shadow-shadow"
        />
        <Heading
          title="Em que página você está?"
          subtitle={`${book.title} já está na sua estante. A página de hoje é o seu primeiro registro.`}
        />
      </div>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
        <label className="flex items-baseline gap-2 rounded-md border border-border bg-surface px-4 py-3 focus-within:border-accent">
          <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Página</span>
          <input
            // biome-ignore lint/a11y/noAutofocus: the only field on this step
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            placeholder={book.pageCount ? `de ${book.pageCount}` : "0"}
            aria-label="Página atual"
            className="w-24 bg-transparent font-mono text-2xl outline-none placeholder:text-base placeholder:text-text-muted"
          />
        </label>
        <Button type="submit" disabled={update.isPending} className="py-3.5">
          {Number.isFinite(page) && page > 0 ? "Marcar página" : "Comecei agora"}
        </Button>
      </form>
      {update.isError && <p className="text-sm text-danger">{errorMessage(update.error)}</p>}
    </section>
  );
}

function GoalStep({ onDone }: { onDone: (goal: number | null) => void }) {
  const updateMe = useUpdateMe();
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [custom, setCustom] = useState("");
  const chosen = custom ? Number.parseInt(custom, 10) : goal;

  function save() {
    if (!Number.isFinite(chosen) || chosen < 1) return;
    updateMe.mutate({ yearlyGoal: chosen }, { onSuccess: () => onDone(chosen) });
  }

  return (
    <section className="flex flex-col gap-8">
      <Heading
        title={`Quantos livros você quer ler em ${YEAR}?`}
        subtitle="Uma meta deixa o progresso visível. Dá pra mudar quando quiser, no seu perfil."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GOALS.map((value) => {
          const selected = !custom && goal === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCustom("");
                setGoal(value);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border p-5 transition",
                selected
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50 hover:bg-surface-muted",
              )}
            >
              {value === DEFAULT_GOAL && (
                <span className="absolute -top-2.5 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">
                  Mais comum
                </span>
              )}
              <span className="font-mono text-3xl font-medium">{value}</span>
              <span className="text-xs text-text-muted">{label(value)}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-3 text-sm text-text-muted">
        Outro número:
        <input
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="ex. 30"
          className="w-24 rounded-md border border-border bg-surface px-3 py-2 font-mono text-text outline-none focus:border-accent"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={save} disabled={updateMe.isPending} className="py-3.5">
          {`Quero ler ${Number.isFinite(chosen) && chosen > 0 ? chosen : "…"} livros`}
        </Button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
        >
          Sem meta por enquanto
        </button>
      </div>
      {updateMe.isError && <p className="text-sm text-danger">{errorMessage(updateMe.error)}</p>}
    </section>
  );
}

function label(goal: number) {
  if (goal <= 6) return "um a cada 2 meses";
  if (goal <= 12) return "um por mês";
  if (goal <= 24) return "dois por mês";
  return "um por semana";
}

function DoneStep({
  book,
  page,
  goal,
}: {
  book: BookSearchResult | null;
  page: number | null;
  goal: number | null;
}) {
  const me = useMe().data;
  const firstName = me?.name.split(" ")[0];
  return (
    <section className="relative flex flex-col items-center gap-8 py-6 text-center">
      <Sparkle className="absolute top-0 left-1/4 size-5 animate-pulse" />
      <Sparkle className="absolute top-16 right-1/4 size-3.5 animate-pulse fill-accent" />
      <Heading
        title={firstName ? `Seu grimório começou, ${firstName}.` : "Seu grimório começou."}
        subtitle="Cada página que você marcar daqui pra frente vira ritmo, meta e o card do mês."
      />
      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {book && (
          <div className="flex items-center gap-4 rounded-xl bg-surface-muted p-4 text-left">
            <BookCover src={book.coverUrl} title={book.title} className="w-14" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Lendo agora
              </p>
              <p className="font-serif font-medium">{book.title}</p>
              {page && <p className="text-sm text-text-muted">página {page}</p>}
            </div>
          </div>
        )}
        {goal && (
          <div className="flex flex-col justify-center rounded-xl bg-surface-muted p-4 text-left">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Meta de {YEAR}
            </p>
            <p className="font-mono text-3xl font-medium">{goal}</p>
            <p className="text-sm text-text-muted">livros</p>
          </div>
        )}
      </div>
      <Link
        to="/"
        className="bg-accent-gradient rounded-full px-7 py-4 font-mono text-sm font-medium uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30 transition hover:opacity-95"
      >
        Abrir meu grimório
      </Link>
    </section>
  );
}
