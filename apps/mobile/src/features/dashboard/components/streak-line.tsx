import { useStreak } from "@grimo/client";
import { streakLabel } from "@grimo/core";
import { Text } from "@/components/ui";

/** The streak ("ofensiva"), with a gentle nudge when today has no reading yet. */
export function StreakLine() {
  const streak = useStreak().data;
  if (!streak?.days) return null;
  return (
    <Text variant="label" color="textMuted">
      <Text variant="label" color="accent">
        Ofensiva
      </Text>{" "}
      · {streakLabel(streak.days)}
      {!streak.readToday && " · leia hoje para não perder"}
    </Text>
  );
}
