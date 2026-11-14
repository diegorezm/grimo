import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "./button";
import { Input } from "./input";
import { Text } from "./text";

/**
 * A small dialog that asks for a name (new shelf, rename, duplicate), optionally with a
 * "Mostrar no meu perfil" switch. Works on iOS and Android (`Alert.prompt` is iOS only).
 */
export function NameDialog({
  visible,
  title,
  initialName = "",
  placeholder,
  confirmLabel,
  askPublic = false,
  initialPublic = true,
  pending = false,
  error,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  initialName?: string;
  placeholder?: string;
  confirmLabel: string;
  askPublic?: boolean;
  initialPublic?: boolean;
  pending?: boolean;
  error?: string | null;
  onSubmit: (name: string, isPublic: boolean) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(initialPublic);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setIsPublic(initialPublic);
    }
  }, [visible, initialName, initialPublic]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Pressable
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: theme.shadow }]}
        >
          <Pressable
            onPress={() => {}}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.edge }]}
          >
            <Text variant="heading">{title}</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder={placeholder}
              maxLength={40}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => onSubmit(name, isPublic)}
            />
            {askPublic && (
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text>Mostrar no meu perfil</Text>
                  <Text variant="small" color="textMuted">
                    Os outros veem só os livros lidos e em leitura.
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ true: theme.accent, false: theme.border }}
                />
              </View>
            )}
            {error && <Text color="danger">{error}</Text>}
            <View style={styles.row}>
              <Button variant="ghost" title="Cancelar" onPress={onClose} />
              <Button
                title={pending ? "Um instante…" : confirmLabel}
                disabled={pending}
                onPress={() => onSubmit(name, isPublic)}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "center", padding: spacing[5] },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing[5], gap: spacing[4] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
});
