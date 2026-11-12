import {
  errorMessage,
  type Profile,
  type SongPreview,
  toast,
  updateMeMutationKey,
  useMyQuotes,
  useSongPreview,
  useUpdateMe,
} from "@grimo/client";
import {
  firstIssue,
  GENRE_LABELS,
  GENRES,
  type Genre,
  musicService,
  PROFILE_COLOR_LABELS,
  PROFILE_COLORS,
  type ProfileColor,
  type ProfileShows,
  updateProfileSchema,
} from "@grimo/core";
import { profileCovers } from "@grimo/tokens";
import { useIsMutating } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkle } from "@/components/ui/sparkle";
import { useColorScheme } from "@/lib/theme";
import { cn } from "@/utils/cn";
import { AvatarUpload } from "./avatar-upload";
import { SongCard } from "./song-card";

const SHOWS: { key: keyof ProfileShows; label: string }[] = [
  { key: "reading", label: "Lendo agora" },
  { key: "goal", label: "Meta do ano" },
  { key: "streak", label: "Ofensiva de leitura" },
];

const MAX_GENRES = 5;
const MAX_BIO = 280;
const GOAL_PRESETS = [12, 24, 36, 52];
const FORM_ID = "profile-form";

/**
 * Name, bio, favorite genres and this year's reading goal. Rendered in the side peek and on
 * its full page; the submit buttons live outside (`ProfileFormActions`) so they can be pinned.
 */
export function ProfileForm({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const update = useUpdateMe();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [goal, setGoal] = useState<number | null>(profile.yearlyGoal);
  const [genres, setGenres] = useState<string[]>(profile.favoriteGenres);
  const [color, setColor] = useState<ProfileColor>(profile.profileColor);
  const [pronouns, setPronouns] = useState(profile.pronouns ?? "");
  const [song, setSong] = useState({
    title: profile.profileSong?.title ?? "",
    artist: profile.profileSong?.artist ?? "",
    url: profile.profileSong?.url ?? "",
  });
  const [quoteId, setQuoteId] = useState(profile.featuredQuote?.id ?? null);
  const [shows, setShows] = useState(profile.profileShows);
  const [error, setError] = useState<string | null>(null);
  const quotes = useMyQuotes().data?.items ?? [];
  const scheme = useColorScheme();
  const year = new Date().getFullYear();

  const songTouched = song.url.trim() !== "";
  const service = musicService(song.url.trim());
  const songPreview = useSongPreview();
  // What the saved song looks like until a new link is read: its stored cover and color.
  const [looks, setLooks] = useState<Pick<SongPreview, "cover" | "color"> | null>(
    profile.profileSong
      ? { cover: profile.profileSong.coverUrl, color: profile.profileSong.color }
      : null,
  );
  const lastRead = useRef(profile.profileSong?.url ?? "");

  // A pasted link is read (name, artist, cover) once the reader stops typing.
  useEffect(() => {
    const url = song.url.trim();
    if (!service || url === lastRead.current) return;
    const timer = setTimeout(() => {
      lastRead.current = url;
      setLooks(null);
      setSong((current) => ({ url: current.url, title: "", artist: "" }));
      songPreview.mutate(url, {
        onSuccess: (preview) => {
          setSong((current) => ({
            url: current.url,
            title: preview.title ?? "",
            artist: preview.artist ?? "",
          }));
          setLooks({ cover: preview.cover, color: preview.color });
        },
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [song.url, service, songPreview.mutate]);

  function removeSong() {
    lastRead.current = "";
    setLooks(null);
    setSong({ title: "", artist: "", url: "" });
  }

  function toggle(genre: string) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : current.length < MAX_GENRES
          ? [...current, genre]
          : current,
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The name and artist come from the link: one that couldn't be read can't be saved yet.
    if (songTouched && (song.title.trim() === "" || song.artist.trim() === "")) {
      return setError(
        songPreview.isPending
          ? "Espere a música carregar para salvar."
          : "Não conseguimos ler esse link de música. Tente outro ou tire a música.",
      );
    }
    const input = updateProfileSchema.safeParse({
      name: name.trim() || undefined,
      bio: bio.trim() || null,
      yearlyGoal: goal && goal > 0 ? goal : null,
      favoriteGenres: genres as Genre[],
      pronouns,
      profileColor: color,
      profileSong: songTouched ? song : null,
      featuredQuoteId: quoteId,
      profileShows: shows,
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    update.mutate(input.data, {
      onSuccess: () => {
        toast.saved("Perfil salvo");
        onDone();
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-medium italic sm:text-4xl">Editar perfil</h1>
        <p className="mt-1 text-text-muted">Como os outros leitores veem você.</p>
      </header>

      <div className="flex flex-wrap items-center gap-6">
        <AvatarUpload image={profile.image} name={profile.name} />
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-wider text-text-muted uppercase">
            Cor do aro
          </span>
          <div className="flex flex-wrap gap-2">
            {PROFILE_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === color}
                aria-label={`Aro ${PROFILE_COLOR_LABELS[option]}`}
                title={PROFILE_COLOR_LABELS[option]}
                onClick={() => setColor(option)}
                className={cn(
                  "size-9 rounded-full transition",
                  option === color ? "border-[3px] border-text" : "border border-border",
                )}
                style={{ background: profileCovers[scheme][option].bg }}
              />
            ))}
          </div>
        </div>
      </div>

      <Section number="01" title="Sobre você" hint="Seu nome e uma frase sobre o que você lê.">
        <Field label="Nome">
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </Field>
        <Field label={`Pronomes (opcional) · @${profile.username}`}>
          <Input
            name="pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            maxLength={24}
            placeholder="ela/dela, ele/dele, elu/delu…"
            autoCapitalize="none"
          />
        </Field>
        <Field
          label="Bio"
          extra={
            <span
              className={cn(
                "font-mono text-[10px]",
                bio.length > MAX_BIO - 20 ? "text-accent" : "text-text-muted",
              )}
            >
              {bio.length}/{MAX_BIO}
            </span>
          }
        >
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={MAX_BIO}
            rows={4}
            placeholder="Ficção científica no café da manhã, fantasia antes de dormir…"
            className="w-full resize-none rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed outline-none placeholder:text-text-muted focus:border-accent"
          />
        </Field>
      </Section>

      <Section
        number="02"
        title={`Meta de ${year}`}
        hint={
          goal
            ? `Cerca de ${(goal / 12).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} livros por mês.`
            : "Quantos livros você quer ler este ano?"
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-border bg-surface">
            <StepButton
              label="Menos um livro"
              onClick={() => setGoal(Math.max(1, (goal ?? 1) - 1))}
            >
              −
            </StepButton>
            <input
              type="number"
              min={1}
              max={1000}
              value={goal ?? ""}
              onChange={(e) => setGoal(e.target.value ? Number(e.target.value) : null)}
              placeholder="—"
              aria-label={`Meta de livros para ${year}`}
              className="w-16 bg-transparent text-center font-serif text-2xl font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <StepButton
              label="Mais um livro"
              onClick={() => setGoal(Math.min(1000, (goal ?? 0) + 1))}
            >
              +
            </StepButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={goal === preset}
                onClick={() => setGoal(preset)}
                className={cn(
                  "rounded-full px-3 py-1 font-mono text-xs transition",
                  goal === preset
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-text-muted hover:text-text",
                )}
              >
                {preset}
              </button>
            ))}
            {goal !== null && (
              <button
                type="button"
                onClick={() => setGoal(null)}
                className="px-2 font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
              >
                Sem meta
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section
        number="03"
        title="Gêneros favoritos"
        hint={`Escolha até ${MAX_GENRES}. ${genres.length} de ${MAX_GENRES} escolhidos.`}
      >
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const selected = genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(genre)}
                disabled={!selected && genres.length >= MAX_GENRES}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition disabled:opacity-40",
                  selected
                    ? "border-transparent bg-accent-gradient text-accent-foreground shadow-sm shadow-accent/30"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                {selected && <Sparkle className="size-3" />}
                {GENRE_LABELS[genre]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        number="04"
        title="Trilha da leitura"
        hint="Cole o link de uma música do Spotify, Apple Music, YouTube ou Deezer: o Grimo busca a capa, o nome e o artista. No perfil, ela abre no app de música."
      >
        <Input
          type="url"
          value={song.url}
          onChange={(e) => setSong({ ...song, url: e.target.value })}
          placeholder="https://open.spotify.com/track/…"
          autoCapitalize="none"
          aria-label="Link da música"
        />
        {song.url.trim() !== "" && !service && (
          <p className="text-sm text-danger">Esse link não é de um app de música aceito.</p>
        )}
        {songPreview.isPending && <p className="text-sm text-text-muted">Buscando a música…</p>}
        {songPreview.isError && (
          <p className="text-sm text-danger">{errorMessage(songPreview.error)}</p>
        )}
        {service &&
          song.title.trim() !== "" &&
          song.artist.trim() !== "" &&
          !songPreview.isPending && (
            <SongCard
              onRemove={removeSong}
              song={{
                title: song.title,
                artist: song.artist,
                url: song.url,
                service,
                coverUrl: looks?.cover ?? null,
                color: looks?.color ?? null,
              }}
            />
          )}
        {songTouched && !songPreview.isPending && song.title.trim() === "" && (
          <Button variant="ghost" onClick={removeSong} className="self-start">
            Tirar a música
          </Button>
        )}
      </Section>

      <Section number="05" title="Frase marcada" hint="Uma das suas citações, no topo do perfil.">
        {quotes.length === 0 ? (
          <p className="text-sm text-text-muted">
            Guarde uma citação na página de um livro para destacar aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Choice selected={quoteId === null} onClick={() => setQuoteId(null)}>
              Nenhuma
            </Choice>
            {quotes.map((quote) => (
              <Choice
                key={quote.id}
                selected={quoteId === quote.id}
                onClick={() => setQuoteId(quote.id)}
              >
                <span className="line-clamp-3 font-serif italic">“{quote.body}”</span>
                {quote.bookTitle && (
                  <span className="text-xs text-text-muted">
                    {quote.bookTitle}
                    {quote.page ? `, pág. ${quote.page}` : ""}
                  </span>
                )}
              </Choice>
            ))}
          </div>
        )}
      </Section>

      <Section number="06" title="Mostrar no perfil" hint="O que os outros leitores veem.">
        <div className="flex flex-col divide-y divide-edge border-y border-edge">
          {SHOWS.map(({ key, label }) => (
            <label key={key} className="flex min-h-12 items-center gap-3">
              <span className="flex-1 text-sm">{label}</span>
              <input
                type="checkbox"
                checked={shows[key]}
                onChange={(e) => setShows({ ...shows, [key]: e.target.checked })}
                className="size-5 accent-accent"
              />
            </label>
          ))}
        </div>
      </Section>

      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}

/** Cancel / Save for `ProfileForm`, placed anywhere (e.g. a pinned footer). */
export function ProfileFormActions({ onCancel }: { onCancel: () => void }) {
  const saving = useIsMutating({ mutationKey: updateMeMutationKey }) > 0;
  return (
    <div className="flex w-full items-center justify-end gap-3">
      <Button variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" form={FORM_ID} disabled={saving}>
        {saving ? "Salvando…" : "Salvar"}
      </Button>
    </div>
  );
}

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-7">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-accent">{number}</span>
        <div>
          <h2 className="font-serif text-xl font-medium italic">{title}</h2>
          <p className="text-sm text-text-muted">{hint}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:pl-8">{children}</div>
    </section>
  );
}

function Field({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
        {extra}
      </span>
      {children}
    </label>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full text-lg text-text-muted transition hover:bg-surface-muted hover:text-text"
    >
      {children}
    </button>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-md border px-3.5 py-3 text-left text-sm transition",
        selected ? "border-accent bg-note" : "border-border bg-surface hover:border-accent/50",
      )}
    >
      {children}
    </button>
  );
}
