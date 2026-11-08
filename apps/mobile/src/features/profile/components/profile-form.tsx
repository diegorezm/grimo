import {
  errorMessage,
  type Profile,
  type SongPreview,
  toast,
  useMyQuotes,
  useShelf,
  useSongPreview,
  useUpdateMe,
} from "@grimo/client";
import {
  firstIssue,
  GENRE_LABELS,
  GENRES,
  type Genre,
  MAX_FAVORITE_BOOKS,
  musicService,
  PROFILE_COLOR_LABELS,
  PROFILE_COLORS,
  type ProfileColor,
  type ProfileShows,
  updateProfileSchema,
} from "@grimo/core";
import { router } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button, Input, Screen, Text } from "@/components/ui";
import { profileCovers, radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { AvatarPicker } from "./avatar-picker";
import { SongCard } from "./song-card";

const MAX_GENRES = 5;

const SHOWS: { key: keyof ProfileShows; label: string }[] = [
  { key: "reading", label: "Lendo agora" },
  { key: "goal", label: "Meta do ano" },
  { key: "streak", label: "Ofensiva de leitura" },
];

/**
 * Edit how your profile looks: cover color, photo, name, pronouns, bio, the "trilha da leitura",
 * the four "livros de cabeceira", a highlighted quote, genres and which reading cards show.
 * The @ stays as it is.
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const updateMe = useUpdateMe();
  const read = useShelf("read").data?.items ?? [];
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
  const [favorites, setFavorites] = useState(profile.favoriteBooks);
  const [quoteId, setQuoteId] = useState(profile.featuredQuote?.id ?? null);
  const [genres, setGenres] = useState<Genre[]>(profile.favoriteGenres as Genre[]);
  const [shows, setShows] = useState(profile.profileShows);
  const [error, setError] = useState<string | null>(null);

  const songTouched = song.title !== "" || song.artist !== "" || song.url !== "";
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
      songPreview.mutate(url, {
        onSuccess: (preview) => {
          setSong((current) => ({
            url: current.url,
            title: preview.title ?? current.title,
            artist: preview.artist ?? current.artist,
          }));
          setLooks({ cover: preview.cover, color: preview.color });
        },
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [song.url, service, songPreview.mutate]);

  function toggleGenre(genre: Genre) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : current.length < MAX_GENRES
          ? [...current, genre]
          : current,
    );
  }

  function toggleFavorite(book: Profile["favoriteBooks"][number]) {
    setFavorites((current) =>
      current.some((item) => item.id === book.id)
        ? current.filter((item) => item.id !== book.id)
        : current.length < MAX_FAVORITE_BOOKS
          ? [...current, book]
          : current,
    );
  }

  function save() {
    const input = updateProfileSchema.safeParse({
      name,
      bio: bio.trim() ? bio : null,
      pronouns,
      profileColor: color,
      profileSong: songTouched ? song : null,
      favoriteBookIds: favorites.map((book) => book.id),
      featuredQuoteId: quoteId,
      favoriteGenres: genres,
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

      <Field label="Capa e foto">
        <View style={[styles.cover, { backgroundColor: profileCovers[scheme][color].bg }]} />
        <View style={styles.avatar}>
          <AvatarPicker image={profile.image} name={profile.name} />
        </View>
        <View style={styles.swatches}>
          {PROFILE_COLORS.map((option) => {
            const active = option === color;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={`Capa ${PROFILE_COLOR_LABELS[option]}`}
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
      </Field>

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
        {songTouched && (
          <Text variant="small" color="textMuted">
            Nome ou artista errado? Corrija aqui:
          </Text>
        )}
        <View style={styles.pair}>
          <Input
            value={song.title}
            onChangeText={(title) => setSong({ ...song, title })}
            placeholder="Música"
            maxLength={80}
            style={styles.grow}
          />
          <Input
            value={song.artist}
            onChangeText={(artist) => setSong({ ...song, artist })}
            placeholder="Artista"
            maxLength={80}
            style={styles.grow}
          />
        </View>
        {songTouched && (
          <Button
            variant="ghost"
            title="Tirar a música"
            onPress={() => {
              lastRead.current = "";
              setLooks(null);
              setSong({ title: "", artist: "", url: "" });
            }}
          />
        )}
      </Field>

      <Field label={`Livros de cabeceira · ${favorites.length}/${MAX_FAVORITE_BOOKS}`}>
        <Text variant="small" color="textMuted">
          Escolha entre os seus Lidos, na ordem em que vão aparecer.
        </Text>
        {read.length === 0 ? (
          <Text color="textMuted">Marque livros como lidos para escolher os favoritos.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.books}
          >
            {read.map(({ book }) => {
              const position = favorites.findIndex((item) => item.id === book.id);
              const selected = position >= 0;
              return (
                <Pressable
                  key={book.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={book.title}
                  accessibilityState={{ checked: selected }}
                  onPress={() =>
                    toggleFavorite({
                      id: book.id,
                      openLibraryId: book.openLibraryId,
                      title: book.title,
                      authors: book.authors,
                      coverUrl: book.coverUrl,
                    })
                  }
                  style={[
                    styles.pick,
                    { opacity: selected || favorites.length < MAX_FAVORITE_BOOKS ? 1 : 0.4 },
                  ]}
                >
                  <BookCover src={book.coverUrl} title={book.title} width={64} />
                  {selected && (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                      <Text variant="label" color="accentForeground">
                        {position + 1}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
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

      <Field label={`Gêneros favoritos · ${genres.length}/${MAX_GENRES}`}>
        <View style={styles.chips}>
          {GENRES.map((genre) => {
            const active = genres.includes(genre);
            return (
              <Pressable
                key={genre}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggleGenre(genre)}
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
      </Field>

      <Field label="Mostrar no perfil">
        <View style={[styles.shows, { backgroundColor: theme.surfaceMuted }]}>
          {SHOWS.map(({ key, label }) => (
            <View key={key} style={styles.showRow}>
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
  cover: { height: 88, borderRadius: radius.lg },
  avatar: { marginTop: -48, marginLeft: spacing[3], alignSelf: "flex-start" },
  swatches: { flexDirection: "row", gap: spacing[3] },
  swatch: { width: 44, height: 44, borderRadius: radius.full },
  bio: { minHeight: 96, textAlignVertical: "top" },
  pair: { flexDirection: "row", gap: spacing[2] },
  grow: { flex: 1 },
  books: { gap: spacing[2] },
  pick: { position: "relative" },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  choice: { borderWidth: 1, borderRadius: radius.md, padding: spacing[3], gap: spacing[1] },
  italic: { fontStyle: "italic" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  shows: { borderRadius: radius.lg, paddingHorizontal: spacing[3] },
  showRow: { flexDirection: "row", alignItems: "center", minHeight: 48, gap: spacing[3] },
});
