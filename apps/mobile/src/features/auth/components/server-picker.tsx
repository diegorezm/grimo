import { probeInstance } from "@grimo/client";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { normalizeServerUrl, useServerStore } from "@/lib/server";

/** Lets the reader point the app at a self-hosted Grimo. */
export function ServerPicker() {
  const { serverUrl, setServerUrl } = useServerStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(serverUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    const url = normalizeServerUrl(value);
    setPending(true);
    setError(null);
    try {
      await probeInstance(url);
      setServerUrl(url);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Servidor inacessível");
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <Pressable onPress={() => setEditing(true)} style={styles.row}>
        <Text variant="small" color="textMuted" numberOfLines={1} style={styles.flex}>
          Servidor: {serverUrl.replace(/^https?:\/\//, "")}
        </Text>
        <Text variant="small" color="primary">
          Trocar
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.edit}>
      <Input
        value={value}
        onChangeText={setValue}
        placeholder="meu-grimo.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {error && <Text color="danger">{error}</Text>}
      <Button title="Conectar" onPress={save} disabled={pending} />
      <Button variant="ghost" title="Cancelar" onPress={() => setEditing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[2] },
  flex: { flex: 1 },
  edit: { gap: spacing[2] },
});
