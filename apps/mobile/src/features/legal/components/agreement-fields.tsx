import type { AgreementInput } from "@grimo/client";
import { birthDateFromBR, MIN_AGE, maskBirthDate } from "@grimo/core";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Input, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { openLegal } from "./legal-links";

/**
 * Birth date (typed as DD/MM/AAAA, sent as YYYY-MM-DD) when the age isn't confirmed yet, and
 * the unchecked "I agree" box, with the documents opening in the in-app browser. Validation is
 * the core `legalAcceptanceSchema`, on submit.
 */
export function AgreementFields({
  value,
  onChange,
  askAge,
}: {
  value: AgreementInput;
  onChange: (value: AgreementInput) => void;
  askAge: boolean;
}) {
  const theme = useTheme();
  const [typed, setTyped] = useState("");

  return (
    <View style={styles.wrap}>
      {askAge && (
        <View style={styles.field}>
          <Text variant="label" color="textMuted">
            Data de nascimento
          </Text>
          <Input
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            value={typed}
            onChangeText={(text) => {
              const masked = maskBirthDate(text);
              setTyped(masked);
              onChange({ ...value, birthDate: birthDateFromBR(masked) });
            }}
          />
          <Text variant="small" color="textMuted">
            O Grimo é para leitores a partir de {MIN_AGE} anos. Guardamos só a confirmação, não a
            data.
          </Text>
        </View>
      )}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value.accepted }}
        onPress={() => onChange({ ...value, accepted: !value.accepted })}
        style={styles.check}
        hitSlop={4}
      >
        <View
          style={[
            styles.box,
            { borderColor: value.accepted ? theme.accent : theme.border },
            value.accepted && { backgroundColor: theme.accent },
          ]}
        >
          {value.accepted && (
            <Text variant="label" color="accentForeground">
              ✓
            </Text>
          )}
        </View>
        <Text variant="small" style={styles.flex}>
          Li e aceito os{" "}
          <Text variant="small" color="accent" onPress={() => openLegal("terms")}>
            Termos de Uso
          </Text>{" "}
          e a{" "}
          <Text variant="small" color="accent" onPress={() => openLegal("privacy")}>
            Política de Privacidade
          </Text>
          , e entendo que meu perfil e o que eu publicar ficam públicos.
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[4] },
  field: { gap: spacing[2] },
  check: { flexDirection: "row", gap: spacing[3], alignItems: "flex-start" },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  flex: { flex: 1 },
});
