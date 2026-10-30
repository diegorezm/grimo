import { useActiveSession, useElapsed, useStreak } from "@grimo/client";
import { formatTimer, streakLabel } from "@grimo/core";
import { BookPeekLink } from "@/features/books";

/**
 * Above the goal: the streak ("ofensiva") with a gentle nudge when today has no reading yet, and
 * the session timer when one is running.
 */
export function StreakLine() {
  const streak = useStreak().data;
  const session = useActiveSession().data;
  const elapsed = useElapsed(session?.startedAt);
  if (!session && !streak?.days) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider">
      {streak && streak.days > 0 && (
        <p className="text-text-muted">
          <span className="text-accent">Ofensiva</span> · {streakLabel(streak.days)}
          {!streak.readToday && " · leia hoje para não perder"}
        </p>
      )}
      {session && (
        <BookPeekLink
          openLibraryId={session.book.openLibraryId}
          className="text-text-muted hover:text-text"
        >
          <span className="text-accent">⏱ {formatTimer(elapsed)}</span> · {session.book.title}
        </BookPeekLink>
      )}
    </div>
  );
}
