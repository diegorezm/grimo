import {
  errorMessage,
  type Profile,
  type SongPreview,
  toast,
  useMyQuotes,
  useSongPreview,
  useUpdateMe,
} from "@grimo/client";
import {
  firstIssue,
  musicService,
  PROFILE_COLOR_LABELS,
  PROFILE_COLORS,
  type ProfileColor,
  type ProfileShows,
  updateProfileSchema,
} from "@grimo/core";
import { router } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Button, Icon, Input, Screen, Text } from "@/components/ui";
import { profileCovers, radius, spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { AvatarPicker } from "./avatar-picker";
import { SongCard } from "./song-card";

const SHOWS: { key: keyof ProfileShows; label: string }[] = [
  { key: "reading", label: "Lendo agora" },
  { key: "goal", label: "Meta do ano" },
  { key: "streak", label: "Ofensiva de leitura" },
];

/**
 * Edit what your profile shows: the photo and its ring color, name, pronouns, bio, the "trilha
 * da leitura", a highlighted quote and which reading cards show.
 * The @ stays as it is.
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const updateMe = useUpdateMe();
  const quotes = useMyQuotes().data?.items ?? [];

  const [color, setColor] = useState<ProfileColor>(profile.profileColor);
  const [name, setName] = useState(profile.name);
  const [pronouns, setPronouns] = useState(profile.pronouns ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [song, setSong] = useState({
    title: profile.profileSong?.title ?? "",
    artist: profile.profileSong?.artist ?? "",
    url: profile.profileSong?.url ?? "",
  });
  const [quoteId, setQuoteId] = useState(profile.featuredQuote?.id ?? null);
  const [shows, setShows] = useState(profile.profileShows);
  const [error, setError] = useState<string | null>(null);

  const songTouched = song.url.trim() !== "";
  const service = musicService(song.url.trim());
  const songPreview = useSongPreview();
  // What the saved song looks like until a new link is read: its stored cover and color.
  const [looks, setLooks] = useState<Pick<SongPreview, "cover" | "color"> | null>(
    profile.profileSong
      ? { cover: profile.profileSong.coverUrl, color: profile.profileSong.color }
      : null,
  );
  const lastRead = useRef(profile.profileSong?.url ?? "");

  // A pasted link is read (name, artist, cover) once the reader stops typing.
  useEffect(() => {
    const url = song.url.trim();
    if (!service || url === lastRead.current) return;
    const timer = setTimeout(() => {
      lastRead.current = url;
      setLooks(null);
      // A new link: what the old one said no longer applies.
      setSong((current) => ({ url: current.url, title: "", artist: "" }));
      songPreview.mutate(url, {
        onSuccess: (preview) => {
          setSong((current) => ({
            url: current.url,
            title: preview.title ?? "",
            artist: preview.artist ?? "",
          }));
          setLooks({ cover: preview.cover, color: preview.color });
        },
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [song.url, service, songPreview.mutate]);

  function removeSong() {
    lastRead.current = "";
    setLooks(null);
    setSong({ title: "", artist: "", url: "" });
  }

  function save() {
    // The name and artist come from the link: one that couldn't be read can't be saved yet.
    if (songTouched && (song.title.trim() === "" || song.artist.trim() === "")) {
      return setError(
        songPreview.isPending
          ? "Espere a música carregar para salvar."
          : "Não conseguimos ler esse link de música. Tente outro ou tire a música.",
      );
    }
    const input = updateProfileSchema.safeParse({
      name,
      bio: bio.trim() ? bio : null,
      pronouns,
      profileColor: color,
      profileSong: songTouched ? song : null,
      featuredQuoteId: quoteId,
      profileShows: shows,
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    updateMe.mutate(input.data, {
      onSuccess: () => {
        router.back();
        toast.saved("Perfil salvo");
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <Screen>
      <View style={styles.bar}>
        <Button variant="ghost" title="Cancelar" onPress={() => router.back()} />
        <Text variant="heading">Editar perfil</Text>
        <Button
          title={updateMe.isPending ? "Salvando…" : "Salvar"}
          disabled={updateMe.isPending}
          onPress={save}
        />
      </View>
      {error && <Text color="danger">{error}</Text>}

      <View style={styles.photo}>
        <AvatarPicker image={profile.image} name={profile.name} />
        <View style={styles.ring}>
          <Text variant="label" color="textMuted">
            Cor do aro
          </Text>
          <View style={styles.swatches}>
            {PROFILE_COLORS.map((option) => {
              const active = option === color;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={`Aro ${PROFILE_COLOR_LABELS[option]}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setColor(option)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: profileCovers[scheme][option].bg,
                      borderColor: active ? theme.text : theme.border,
                      borderWidth: active ? 3 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      <Field label="Nome">
        <Input value={name} onChangeText={setName} maxLength={80} autoComplete="name" />
      </Field>
      <Field label={`Pronomes (opcional) · @${profile.username}`}>
        <Input
          value={pronouns}
          onChangeText={setPronouns}
          maxLength={24}
          placeholder="ela/dela, ele/dele, elu/delu…"
          autoCapitalize="none"
        />
      </Field>
      <Field label={`Bio · ${bio.length}/280`}>
        <Input
          value={bio}
          onChangeText={setBio}
          maxLength={280}
          multiline
          placeholder="O que você gosta de ler?"
          style={styles.bio}
        />
      </Field>

      <Field label="Trilha da leitura">
        <Text variant="small" color="textMuted">
          Cole o link de uma música do Spotify, Apple Music, YouTube ou Deezer: o Grimo busca a
          capa, o nome e o artista. No perfil, ela abre no app de música.
        </Text>
        <Input
          value={song.url}
          onChangeText={(url) => setSong({ ...song, url })}
          placeholder="https://open.spotify.com/track/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {song.url.trim() !== "" && !service && (
          <Text variant="small" color="danger">
            Esse link não é de um app de música aceito.
          </Text>
        )}
        {songPreview.isPending && (
          <Text variant="small" color="textMuted">
            Buscando a música…
          </Text>
        )}
        {songPreview.isError && (
          <Text variant="small" color="danger">
            {errorMessage(songPreview.error)}
          </Text>
        )}
        {service &&
          song.title.trim() !== "" &&
          song.artist.trim() !== "" &&
          !songPreview.isPending && (
            <SongCard
              interactive={false}
              onRemove={removeSong}
              song={{
                title: song.title,
                artist: song.artist,
                url: song.url,
                service,
                coverUrl: looks?.cover ?? null,
                color: looks?.color ?? null,
              }}
            />
          )}
        {songTouched && !songPreview.isPending && song.title.trim() === "" && (
          <Button variant="ghost" title="Tirar a música" onPress={removeSong} />
        )}
      </Field>

      <Field label="Frase marcada">
        {quotes.length === 0 ? (
          <Text color="textMuted">
            Guarde uma citação na página de um livro para destacar aqui.
          </Text>
        ) : (
          <>
            <Choice selected={quoteId === null} onPress={() => setQuoteId(null)}>
              <Text>Nenhuma</Text>
            </Choice>
            {quotes.map((quote) => (
              <Choice
                key={quote.id}
                selected={quoteId === quote.id}
                onPress={() => setQuoteId(quote.id)}
              >
                <Text style={styles.italic} numberOfLines={3}>
                  “{quote.body}”
                </Text>
                {quote.bookTitle && (
                  <Text variant="small" color="textMuted">
                    {quote.bookTitle}
                    {quote.page ? `, pág. ${quote.page}` : ""}
                  </Text>
                )}
              </Choice>
            ))}
          </>
        )}
      </Field>

      <Field label="Mostrar no perfil">
        <View style={[styles.shows, { borderColor: theme.edge }]}>
          {SHOWS.map(({ key, label }, index) => (
            <View
              key={key}
              style={[
                styles.showRow,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.edge },
              ]}
            >
              <Text style={styles.grow}>{label}</Text>
              <Switch
                accessibilityLabel={`Mostrar ${label}`}
                value={shows[key]}
                onValueChange={(value) => setShows({ ...shows, [key]: value })}
                trackColor={{ true: theme.accent, false: theme.border }}
              />
            </View>
          ))}
        </View>
      </Field>

      <Button
        title={updateMe.isPending ? "Salvando…" : "Salvar"}
        disabled={updateMe.isPending}
        onPress={save}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/settings")}
        style={({ pressed }) => [
          styles.settings,
          { borderColor: theme.edge, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.grow}>Aparência, conta e sair</Text>
        <Icon name="chevronRight" size={16} color="textMuted" />
      </Pressable>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Choice({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          borderColor: selected ? theme.accent : theme.border,
          backgroundColor: selected ? theme.note : theme.surface,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  field: { gap: spacing[2] },
  photo: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
  ring: { flex: 1, gap: spacing[2] },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  swatch: { width: 36, height: 36, borderRadius: radius.full },
  bio: { minHeight: 96, textAlignVertical: "top" },
  grow: { flex: 1 },
  choice: { borderWidth: 1, borderRadius: radius.md, padding: spacing[3], gap: spacing[1] },
  italic: { fontStyle: "italic" },
  shows: { borderTopWidth: 1, borderBottomWidth: 1 },
  showRow: { flexDirection: "row", alignItems: "center", minHeight: 52, gap: spacing[3] },
  settings: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
});
