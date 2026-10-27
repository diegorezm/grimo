import { errorMessage, type Profile, useUpdateMe } from "@grimo/client";
import { firstIssue, GENRE_LABELS, GENRES, type Genre, updateProfileSchema } from "@grimo/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Input, Screen, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { AvatarPicker } from "./avatar-picker";

const MAX_GENRES = 5;

/** Edit your photo, name, bio and up to five favorite genres. The @ stays as it is. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const updateMe = useUpdateMe();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [genres, setGenres] = useState<Genre[]>(profile.favoriteGenres as Genre[]);
  const [error, setError] = useState<string | null>(null);

  function toggle(genre: Genre) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : current.length < MAX_GENRES
          ? [...current, genre]
          : current,
    );
  }

  function save() {
    const input = updateProfileSchema.safeParse({
      name,
      bio: bio.trim() ? bio : null,
      favoriteGenres: genres,
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    updateMe.mutate(input.data, {
      onSuccess: () => router.back(),
      onError: (e) => setError(errorMessage(e)),
    });
  }

  return (
    <Screen>
      <Button variant="ghost" title="‹ Voltar" onPress={() => router.back()} />
      <Text variant="display">Editar perfil</Text>
      <View style={styles.center}>
        <AvatarPicker image={profile.image} name={profile.name} />
        <Text variant="label" color="textMuted">
          @{profile.username}
        </Text>
      </View>

      <View style={styles.field}>
        <Text variant="label" color="textMuted">
          Nome
        </Text>
        <Input value={name} onChangeText={setName} maxLength={80} autoComplete="name" />
      </View>
      <View style={styles.field}>
        <Text variant="label" color="textMuted">
          Bio · {bio.length}/280
        </Text>
        <Input
          value={bio}
          onChangeText={setBio}
          maxLength={280}
          multiline
          placeholder="O que você gosta de ler?"
          style={styles.bio}
        />
      </View>
      <View style={styles.field}>
        <Text variant="label" color="textMuted">
          Gêneros favoritos · {genres.length}/{MAX_GENRES}
        </Text>
        <View style={styles.chips}>
          {GENRES.map((genre) => {
            const active = genres.includes(genre);
            return (
              <Pressable
                key={genre}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggle(genre)}
                style={[
                  styles.chip,
                  { borderColor: active ? theme.accent : theme.border },
                  active && { backgroundColor: theme.accent },
                ]}
              >
                <Text variant="label" color={active ? "accentForeground" : "text"}>
                  {GENRE_LABELS[genre]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error && <Text color="danger">{error}</Text>}
      <Button
        title={updateMe.isPending ? "Salvando…" : "Salvar"}
        disabled={updateMe.isPending}
        onPress={save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: spacing[2] },
  field: { gap: spacing[2] },
  bio: { minHeight: 96, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
