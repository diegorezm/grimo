import type { Profile } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Sparkle } from "@/components/ui/sparkle";

/** Profile hero card: avatar, name, bio, favorite genres and follow counts. */
export function ProfileHeader({ profile, actions }: { profile: Profile; actions?: ReactNode }) {
  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-surface-muted p-6 sm:flex-row sm:items-center sm:p-8">
      <Sparkle className="absolute top-5 right-1/3 size-4 opacity-80" />
      <Sparkle className="absolute right-8 bottom-6 size-3 opacity-60" />
      <Avatar
        src={profile.image}
        name={profile.name}
        size="size-24"
        className="bg-accent-gradient text-accent-foreground shadow-lg shadow-accent/30"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-medium italic lg:text-4xl">{profile.name}</h1>
            {profile.username && (
              <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
                @{profile.username}
              </p>
            )}
          </div>
          {actions}
        </div>
        {profile.bio && <p className="max-w-2xl">{profile.bio}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-2 text-text-muted">
            <strong className="text-text">{profile.followers}</strong> seguidores ·{" "}
            <strong className="text-text">{profile.following}</strong> seguindo
          </span>
          {profile.favoriteGenres.map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-surface px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-text-muted"
            >
              {GENRE_LABELS[genre as Genre] ?? genre}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
