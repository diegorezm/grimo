import type { ReaderCard } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { BookOpenIcon } from "@/components/ui/icons";
import { Sparkle } from "@/components/ui/sparkle";
import { StaffBadge } from "@/components/ui/staff-badge";
import { BookCover } from "@/features/books";
import { cn } from "@/utils/cn";
import { FollowButton } from "./follow-button";

type Reader = Pick<
  ReaderCard,
  | "id"
  | "name"
  | "username"
  | "image"
  | "role"
  | "bio"
  | "followers"
  | "bookCount"
  | "covers"
  | "readingNow"
  | "isFollowing"
  | "followsYou"
>;

/** Tilt of each cover in the little fan, back to front. */
const FAN = ["-rotate-12 translate-x-6", "-rotate-3 translate-x-3", "rotate-6"];

/**
 * A reader as a journal page: their latest covers fanned out on top, the avatar over them, then
 * name, bio, what they are reading and the follow button. The whole card opens the profile.
 * `note` is an accent line (e.g. "Seguido por Bia"); `canFollow` is false for yourself and
 * when signed out.
 */
export function ReaderTile({
  reader,
  note,
  canFollow,
}: {
  reader: Reader;
  note?: ReactNode;
  canFollow: boolean;
}) {
  return (
    <li className="page group relative flex flex-col rounded-lg transition hover:-translate-y-0.5 hover:border-accent/40">
      <div className="relative h-28 overflow-hidden rounded-t-lg bg-surface-muted">
        {/* The profile banner's gradient, as a wash, so a card reads as a small profile. */}
        <div aria-hidden="true" className="bg-accent-gradient absolute inset-0 opacity-25" />
        <Sparkle className="absolute top-4 right-1/2 size-3 opacity-70" />
        <div aria-hidden="true" className="absolute right-6 -bottom-5 flex items-end">
          {reader.covers.map((src, i) => (
            <BookCover
              key={src}
              src={src}
              title=""
              className={cn(
                "-ml-6 w-14 shadow-lg shadow-shadow transition group-hover:-translate-y-1",
                FAN[i + FAN.length - reader.covers.length],
              )}
            />
          ))}
        </div>
        {reader.followsYou && (
          <span className="absolute top-3 left-3 rounded-sm bg-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
            Segue você
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        <Avatar
          src={reader.image}
          name={reader.name}
          size="size-16"
          className="relative -mt-8 bg-accent-gradient text-accent-foreground shadow-md ring-4 ring-surface"
        />
        <div className="min-w-0">
          <Link
            to="/u/$username"
            params={{ username: reader.username ?? "" }}
            className="block truncate font-serif text-xl font-medium italic leading-tight after:absolute after:inset-0 after:rounded-lg group-hover:underline"
          >
            {reader.name}
          </Link>
          <p className="flex items-center gap-2 truncate font-mono text-[11px] text-text-muted">
            @{reader.username}
            <StaffBadge role={reader.role} />
          </p>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-snug text-text-muted">
          {reader.bio ?? "Ainda sem bio."}
        </p>

        <p className="flex min-w-0 items-center gap-2 text-sm">
          <BookOpenIcon className="size-4 text-accent" />
          {reader.readingNow ? (
            <span className="truncate">
              <span className="text-text-muted">Lendo </span>
              <span className="font-serif italic">{reader.readingNow}</span>
            </span>
          ) : (
            <span className="text-text-muted">Nenhum livro aberto</span>
          )}
        </p>

        {note && (
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-accent">
            {note}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <dl className="flex gap-5">
            <Stat value={reader.bookCount} label={reader.bookCount === 1 ? "livro" : "livros"} />
            <Stat
              value={reader.followers}
              label={reader.followers === 1 ? "seguidor" : "seguidores"}
            />
          </dl>
          {canFollow && <FollowButton reader={reader} size="sm" className="relative z-10" />}
        </div>
      </div>
    </li>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="font-serif text-lg font-medium leading-tight">{value}</dd>
    </div>
  );
}

/** Responsive grid for `ReaderTile`s: adapts to the space the screen has (container queries). */
export function ReaderGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-5 @xl/main:grid-cols-2 @6xl/main:grid-cols-3">
      {children}
    </ul>
  );
}
