import { type Profile, updateMeMutationKey, useUpdateMe } from "@grimo/client";
import { GENRE_LABELS, GENRES, type Genre } from "@grimo/core";
import { useIsMutating } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

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
  const year = new Date().getFullYear();

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
    update.mutate(
      {
        name: name.trim() || undefined,
        bio: bio.trim() || null,
        yearlyGoal: goal && goal > 0 ? goal : null,
        favoriteGenres: genres as Genre[],
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-medium italic sm:text-4xl">Editar perfil</h1>
        <p className="mt-1 text-text-muted">Como os outros leitores veem você.</p>
      </header>

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

      {update.error && <p className="text-sm text-danger">{update.error.message}</p>}
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
