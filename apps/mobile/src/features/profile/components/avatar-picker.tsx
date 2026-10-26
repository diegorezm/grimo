import { useRemoveAvatar, useUploadAvatar } from "@grimo/client";
import { AVATAR_SIZE } from "@grimo/core";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const SIZE = 88;

/**
 * Your avatar on the profile. Tapping it lets you pick a photo (library or camera), crops it
 * square, shrinks it to AVATAR_SIZE and uploads it; or removes the current one.
 */
export function AvatarPicker({ image, name }: { image: string | null; name: string }) {
  const theme = useTheme();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const busy = upload.isPending || remove.isPending;

  async function pick(source: "library" | "camera") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Sem permissão",
        "Libere o acesso nas configurações do iPhone para escolher a foto.",
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    // Square crop already happened in the picker; shrink and re-encode as JPEG.
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });
    const rendered = await context.renderAsync();
    const photo = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    const info = await FileSystem.getInfoAsync(photo.uri);

    upload.mutate(
      {
        contentType: "image/jpeg",
        size: info.exists ? info.size : 0,
        // Native upload straight from the file (React Native Blobs are unreliable as bodies).
        send: async (url) => {
          const res = await FileSystem.uploadAsync(url, photo.uri, {
            httpMethod: "POST",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: { "Content-Type": "image/jpeg" },
          });
          if (res.status < 200 || res.status >= 300) {
            throw new Error("Não foi possível enviar a foto");
          }
          return res.body;
        },
      },
      { onError: (error) => Alert.alert("Não foi possível trocar a foto", error.message) },
    );
  }

  function openMenu() {
    Alert.alert("Foto do perfil", undefined, [
      { text: "Escolher da galeria", onPress: () => void pick("library") },
      { text: "Tirar foto", onPress: () => void pick("camera") },
      ...(image
        ? [{ text: "Remover foto", style: "destructive" as const, onPress: () => remove.mutate() }]
        : []),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Trocar foto do perfil"
      disabled={busy}
      onPress={openMenu}
      style={[styles.ring, { borderColor: theme.accent }]}
    >
      {image ? (
        <Image source={image} style={styles.avatar} transition={150} />
      ) : (
        <View style={[styles.avatar, styles.center, { backgroundColor: theme.surfaceMuted }]}>
          <Text variant="display">{name.slice(0, 1)}</Text>
        </View>
      )}
      {busy && (
        <View
          style={[styles.avatar, styles.center, styles.overlay, { backgroundColor: theme.glass }]}
        >
          <ActivityIndicator color={theme.accent} />
        </View>
      )}
      <View
        style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.background }]}
      >
        <Text style={[styles.plus, { color: theme.accentForeground }]}>+</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 3, borderRadius: radius.full, padding: 3 },
  avatar: { width: SIZE, height: SIZE, borderRadius: radius.full },
  center: { alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute", top: 3, left: 3 },
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { fontSize: 18, lineHeight: 20, fontWeight: "700" },
});
