import { type Profile, useReaderShelves } from "@grimo/client";
import { compactCount, DEFAULT_PROFILE_COLOR } from "@grimo/core";
import { profileCovers } from "@grimo/tokens";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useColorScheme } from "@/lib/theme";
import { SongCard } from "./song-card";

/**
 * Profile top, like a magazine (the web twin of mobile's `ProfileHeader`): the photo ringed in
 * the reader's color, name with @, pronouns and role, the numbers in two short lines, the bio,
 * the highlighted quote and the "trilha da leitura". `actions` sit beside the name (Seguir,
 * Editar); `followsYou` adds a quiet "segue você".
 */
export function ProfileHeader({
  profile,
  actions,
  followsYou = false,
}: {
  profile: Profile;
  actions?: ReactNode;
  followsYou?: boolean;
}) {
  // Same query as the Estantes tab (cached once): books read and their pages.
  const shelves = useReaderShelves(profile.username).data;
  const scheme = useColorScheme();
  // Answers cached (or served) before profile colors existed have none.
  const ring = profileCovers[scheme][profile.profileColor ?? DEFAULT_PROFILE_COLOR].bg;
  const role =
    profile.role === "admin" ? "admin" : profile.role === "moderator" ? "moderador" : null;
  const handle = [profile.username && `@${profile.username}`, profile.pronouns, role]
    .filter(Boolean)
    .join(" · ");
  const quote = profile.featuredQuote;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-5">
        <span className="rounded-full border-[3px] p-0.5" style={{ borderColor: ring }}>
          <Avatar
            src={profile.image}
            name={profile.name}
            size="size-24"
            className="bg-glow-a text-3xl text-text"
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-4xl font-medium italic lg:text-5xl">{profile.name}</h1>
          {handle && (
            <p className="font-mono text-xs tracking-[0.12em] text-text-muted uppercase">
              {handle}
              {followsYou && " · segue você"}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="flex flex-col gap-1 text-[15px] text-text-muted">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Stat value={shelves?.read.count ?? null} label="lidos" />
          <Dot />
          <Stat value={shelves?.read.pages ?? null} label="páginas" />
        </p>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Stat
            value={profile.followers}
            label="seguidores"
            to={{ username: profile.username, kind: "followers" }}
          />
          <Dot />
          <Stat
            value={profile.following}
            label="seguindo"
            to={{ username: profile.username, kind: "following" }}
          />
        </p>
      </div>

      {profile.bio && <p className="max-w-2xl text-lg leading-relaxed">{profile.bio}</p>}

      {quote && (
        <figure className="flex max-w-2xl gap-2">
          <span
            aria-hidden="true"
            className="font-serif text-4xl leading-none text-ornament italic"
          >
            “
          </span>
          <div className="flex flex-col gap-1 pt-1">
            <blockquote className="font-serif text-lg leading-snug italic">{quote.body}</blockquote>
            {quote.bookTitle && (
              <figcaption className="text-sm text-text-muted">
                {quote.bookTitle}
                {quote.page ? `, pág. ${quote.page}` : ""}
              </figcaption>
            )}
          </div>
        </figure>
      )}

      {profile.profileSong && (
        <div className="max-w-md">
          <SongCard song={profile.profileSong} />
        </div>
      )}
    </section>
  );
}

function Dot() {
  return <span aria-hidden="true">·</span>;
}

/** "10 lidos", "1,9 mil páginas": the number in mono, the label in text, on one line. */
function Stat({
  value,
  label,
  to,
}: {
  /** `null` while loading (a dash). */
  value: number | null;
  label: string;
  to?: { username: string; kind: "followers" | "following" };
}) {
  const content = (
    <>
      <span className="font-mono font-semibold text-text">
        {value === null ? "–" : compactCount(value)}
      </span>{" "}
      {label}
    </>
  );
  if (!to?.username) return <span>{content}</span>;
  return (
    <Link
      to={to.kind === "followers" ? "/u/$username/followers" : "/u/$username/following"}
      params={{ username: to.username }}
      className="decoration-border underline-offset-4 hover:text-text hover:underline"
    >
      {content}
    </Link>
  );
}
