import type { Profile } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";

export function ProfileHeader({ profile, actions }: { profile: Profile; actions?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar src={profile.image} name={profile.name} className="size-16" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {profile.username && <p className="text-sm text-text-muted">@{profile.username}</p>}
        </div>
        {actions}
      </div>
      {profile.bio && <p className="text-sm">{profile.bio}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-text-muted">
        <span>
          <strong className="text-text">{profile.followers}</strong> seguidores
        </span>
        <span>
          <strong className="text-text">{profile.following}</strong> seguindo
        </span>
        {profile.favoriteGenres.map((genre) => (
          <span key={genre} className="rounded-full bg-surface-muted px-2">
            {GENRE_LABELS[genre as Genre] ?? genre}
          </span>
        ))}
      </div>
    </section>
  );
}
