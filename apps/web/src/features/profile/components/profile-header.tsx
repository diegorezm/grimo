import type { Profile } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Sparkle } from "@/components/ui/sparkle";

/**
 * Profile header: a banner (a tilted mosaic of the reader's covers, or the accent gradient),
 * the avatar overlapping it, then name, bio, counts and favorite genres.
 */
export function ProfileHeader({
  profile,
  covers = [],
  bookCount,
  actions,
}: {
  profile: Profile;
  covers?: string[];
  bookCount?: number;
  actions?: ReactNode;
}) {
  // Repeat covers so the mosaic always fills the banner.
  const tiles =
    covers.length > 0 ? Array.from({ length: 24 }, (_, i) => covers[i % covers.length]!) : [];

  return (
    <section className="flex flex-col">
      <div className="bg-accent-gradient relative h-44 overflow-hidden rounded-xl sm:h-56">
        {tiles.length > 0 && (
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 -top-24 grid -rotate-6 grid-cols-6 gap-3 opacity-90 sm:grid-cols-12"
          >
            {tiles.map((src, i) => (
              <img
                // biome-ignore lint/suspicious/noArrayIndexKey: covers repeat on purpose
                key={i}
                src={src}
                alt=""
                className="aspect-[2/3] w-full rounded-sm object-cover shadow-md"
              />
            ))}
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent"
        />
        <Sparkle className="absolute top-6 right-10 size-6" />
        <Sparkle className="absolute top-20 right-28 size-3 fill-surface" />
      </div>

      <div className="relative z-10 px-2 sm:px-8">
        <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
          <Avatar
            src={profile.image}
            name={profile.name}
            size="size-28"
            className="bg-accent-gradient text-accent-foreground shadow-lg ring-4 ring-surface"
          />
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <h1 className="mt-4 text-4xl font-medium italic lg:text-5xl">{profile.name}</h1>
        {profile.username && (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
            @{profile.username}
          </p>
        )}
        {profile.bio && <p className="mt-4 max-w-2xl text-lg leading-relaxed">{profile.bio}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <dl className="flex gap-6">
            {bookCount !== undefined && <Count value={bookCount} label="livros" />}
            <Count value={profile.followers} label="seguidores" />
            <Count value={profile.following} label="seguindo" />
          </dl>
          {profile.favoriteGenres.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Gêneros favoritos">
              {profile.favoriteGenres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-text-muted"
                >
                  {GENRE_LABELS[genre as Genre] ?? genre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="font-serif text-xl font-medium">{value}</dd>
      <dt className="text-sm text-text-muted">{label}</dt>
    </div>
  );
}
