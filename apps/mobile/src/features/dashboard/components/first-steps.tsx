import { useOnboardingChecklist, useUpdateMe } from "@grimo/client";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, ProgressBar, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const GOALS = [6, 12, 24, 52];
/** Pre-highlighted: what most readers pick. */
const DEFAULT_GOAL = 12;

/**
 * "Primeiros passos" until the reader has a book on the shelf and a yearly goal. Progress starts
 * with the account done; the goal is picked right here, in one tap. (Following readers lives on
 * the web for now, so it isn't listed here.)
 */
export function FirstSteps() {
  const theme = useTheme();
  const checklist = useOnboardingChecklist();
  const updateMe = useUpdateMe();
  if (!checklist) return null;

  const steps = checklist.steps.filter((step) => step.id !== "follow");
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;
  const goalPending = steps.some((step) => step.id === "goal" && !step.done);

  return (
    <Card>
      <View style={styles.between}>
        <Text variant="heading">Primeiros passos</Text>
        <Text variant="label" color="textMuted">
          {done} de {steps.length}
        </Text>
      </View>
      <ProgressBar percent={Math.round((done / steps.length) * 100)} height={6} />
      {steps.map((step) => (
        <Pressable
          key={step.id}
          accessibilityRole="button"
          disabled={step.done || step.id !== "book"}
          onPress={() => router.navigate("/search")}
          style={styles.step}
        >
          <View
            style={[
              styles.dot,
              step.done
                ? { backgroundColor: theme.accent, borderColor: theme.accent }
                : { borderColor: theme.border },
            ]}
          >
            {step.done && (
              <Text variant="small" color="accentForeground">
                ✓
              </Text>
            )}
          </View>
          <Text
            color={step.done ? "textMuted" : "text"}
            style={step.done ? styles.doneText : undefined}
          >
            {step.label}
            {!step.done && step.id === "book" ? " →" : ""}
          </Text>
        </Pressable>
      ))}
      {goalPending && (
        <View style={styles.goals}>
          {GOALS.map((goal) => (
            <Pressable
              key={goal}
              accessibilityRole="button"
              accessibilityLabel={`Meta de ${goal} livros`}
              disabled={updateMe.isPending}
              onPress={() => updateMe.mutate({ yearlyGoal: goal })}
              style={[
                styles.goal,
                {
                  borderColor: goal === DEFAULT_GOAL ? theme.accent : theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <Text variant="number">{goal}</Text>
              <Text variant="small" color="textMuted">
                {goal === DEFAULT_GOAL ? "mais comum" : "livros"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  step: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  dot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { textDecorationLine: "line-through" },
  goals: { flexDirection: "row", gap: spacing[2] },
  goal: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
  },
});
