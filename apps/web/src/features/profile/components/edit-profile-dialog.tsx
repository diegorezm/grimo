import { type Profile, useUpdateMe } from "@grimo/client";
import { GENRE_LABELS, GENRES, type Genre } from "@grimo/core";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

const MAX_GENRES = 5;

/** Modal to edit name, bio, favorite genres and this year's reading goal. */
export function EditProfileDialog({
  profile,
  open,
  onClose,
}: {
  profile: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const update = useUpdateMe();
  const [genres, setGenres] = useState<string[]>(profile.favoriteGenres);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      setGenres(profile.favoriteGenres);
      node.showModal();
    }
    if (!open && node.open) node.close();
  }, [open, profile.favoriteGenres]);

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
    const form = new FormData(event.currentTarget);
    const goal = Number(form.get("yearlyGoal"));
    update.mutate(
      {
        name: String(form.get("name")).trim() || undefined,
        bio: String(form.get("bio")).trim() || null,
        yearlyGoal: goal > 0 ? goal : null,
        favoriteGenres: genres as Genre[],
      },
      { onSuccess: onClose },
    );
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="edit-profile-title"
      className="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-xl bg-surface p-0 text-text shadow-2xl shadow-shadow backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form key={String(open)} onSubmit={submit} className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-profile-title" className="text-3xl font-medium italic">
              Editar perfil
            </h2>
            <p className="text-sm text-text-muted">Como os outros leitores veem você.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
          >
            ✕
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Nome">
            <Input name="name" defaultValue={profile.name} maxLength={80} required />
          </Field>
          <Field label={`Meta de ${new Date().getFullYear()}`}>
            <Input
              name="yearlyGoal"
              type="number"
              min={1}
              max={1000}
              defaultValue={profile.yearlyGoal ?? ""}
              placeholder="livros"
            />
          </Field>
          <Field label="Bio" className="sm:col-span-2">
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={280}
              rows={3}
              placeholder="O que você gosta de ler?"
              className="w-full resize-none rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-text-muted focus:border-accent"
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Gêneros favoritos · {genres.length}/{MAX_GENRES}
          </legend>
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
                    "rounded-full border px-3 py-1 text-sm transition disabled:opacity-40",
                    selected
                      ? "border-transparent bg-accent text-accent-foreground"
                      : "border-border hover:bg-surface-muted",
                  )}
                >
                  {GENRE_LABELS[genre]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <footer className="flex items-center justify-end gap-3">
          {update.error && (
            <span className="mr-auto text-sm text-danger">{update.error.message}</span>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={update.isPending}>
            Salvar
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
