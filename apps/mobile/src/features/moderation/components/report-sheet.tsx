import { errorMessage, useReport } from "@grimo/client";
import {
  firstIssue,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  REPORT_TARGET_TITLES,
  type ReportReason,
  type ReportTarget,
  reportSchema,
} from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Input, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Pick a reason (and say more when it's "other"); validated with the core `reportSchema`. */
export function ReportSheet({ target, targetId }: { target: ReportTarget; targetId: string }) {
  const theme = useTheme();
  const report = useReport();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!reason) return setError("Escolha um motivo");
    const parsed = reportSchema.safeParse({
      target,
      targetId,
      reason,
      details: details.trim() || undefined,
    });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    setError(null);
    report.mutate(
      { target, targetId, reason, details },
      { onError: (failure) => setError(errorMessage(failure)) },
    );
  }

  if (report.isSuccess) {
    return (
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <Text variant="heading">Obrigado por avisar</Text>
        <Text color="textMuted">
          Vamos analisar a denúncia. Se quiser parar de ver essa pessoa, você também pode
          bloqueá-la.
        </Text>
        <Button title="Fechar" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.sheet}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="heading">{REPORT_TARGET_TITLES[target]}</Text>
      <Text color="textMuted">Qual é o problema?</Text>
      {REPORT_REASONS.filter((r) => target === "user" || r !== "underage").map((r) => (
        <Pressable
          key={r}
          accessibilityRole="radio"
          accessibilityState={{ checked: reason === r }}
          onPress={() => setReason(r)}
          style={[styles.option, { borderColor: reason === r ? theme.accent : theme.border }]}
        >
          <Text color={reason === r ? "accent" : "text"}>{REPORT_REASON_LABELS[r]}</Text>
        </Pressable>
      ))}
      <Input
        value={details}
        onChangeText={setDetails}
        placeholder={reason === "other" ? "Conte o que aconteceu" : "Detalhes (opcional)"}
        multiline
        maxLength={1000}
      />
      {error && <Text color="danger">{error}</Text>}
      <Button
        title={report.isPending ? "Enviando…" : "Enviar denúncia"}
        disabled={report.isPending}
        onPress={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: spacing[5], gap: spacing[3] },
  option: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
