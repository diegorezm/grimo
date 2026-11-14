import type { ReaderPage } from "@grimo/client";
import type { ReactNode } from "react";
import { ProfileHeader } from "./profile-header";
import { ProfileFeatured, ProfileReadingNow, ProfileTabs } from "./profile-tabs";

/**
 * A whole profile page: the magazine top and the tabs, with a side column on wide screens for
 * what is always worth seeing ("Lendo agora", the goal and streak, and `aside`, e.g. your monthly
 * card). On narrow screens the side column comes before the tabs. Routes pass what comes from
 * other features: the buttons beside the name, the activity list and the year's numbers.
 * `blocked` (you blocked them) replaces everything below the top.
 */
export function ProfileView({
  page,
  username,
  isMe = false,
  actions,
  activity,
  year,
  streak,
  aside,
  blocked,
}: {
  page: ReaderPage;
  username: string;
  isMe?: boolean;
  actions?: ReactNode;
  activity: ReactNode;
  year: ReactNode;
  streak?: number | null;
  aside?: ReactNode;
  blocked?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-2 pb-10 lg:px-8 lg:pt-6">
      <ProfileHeader profile={page.profile} actions={actions} followsYou={page.followsYou} />
      {blocked ?? (
        <div className="grid grid-cols-1 gap-8 @5xl/main:grid-cols-[minmax(0,1fr)_20rem]">
          <aside className="flex flex-col gap-4 @5xl/main:sticky @5xl/main:top-6 @5xl/main:order-2 @5xl/main:self-start">
            <ProfileReadingNow page={page} />
            <ProfileFeatured page={page} streak={streak} />
            {aside}
          </aside>
          <div className="min-w-0 @5xl/main:order-1">
            <ProfileTabs username={username} isMe={isMe} activity={activity} year={year} />
          </div>
        </div>
      )}
    </div>
  );
}
