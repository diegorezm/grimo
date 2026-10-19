import { type Profile, useUpdateMe } from "@grimo/client";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Edit name, bio and this year's reading goal. */
export function ProfileEditor({ profile }: { profile: Profile }) {
  const update = useUpdateMe();
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const goal = Number(form.get("yearlyGoal"));
    setSaved(false);
    update.mutate(
      {
        name: String(form.get("name")).trim() || undefined,
        bio: String(form.get("bio")).trim() || null,
        yearlyGoal: goal > 0 ? goal : null,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <section aria-labelledby="editor-title" className="flex flex-col gap-4">
      <h2 id="editor-title" className="text-2xl font-medium italic">
        Seu perfil
      </h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_10rem]">
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
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" disabled={update.isPending}>
            Salvar
          </Button>
          {saved && <span className="text-sm text-success">Salvo ✦</span>}
          {update.error && <span className="text-sm text-danger">{update.error.message}</span>}
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
