import {
  errorMessage,
  type ShelfItem,
  toast,
  useRemoveSavedShelf,
  useRemoveTag,
  useSavedShelves,
  useSaveShelf,
  useShelfFilterStore,
  useShelfTags,
} from "@grimo/client";
import {
  countByShelf,
  firstIssue,
  GENRE_LABELS,
  type Genre,
  isFilterEmpty,
  SHELF_LABELS,
  SHELF_STATUSES,
  savedShelfSchema,
  shelfGenres,
} from "@grimo/core";
import { type ReactNode, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Button, Chip, Input, Text } from "@/components/ui";
import { spacing } from "@/constants/theme";
import { NewTag } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

/** Genre chips shown before "mais". */
const GENRES_SHOWN = 8;

/**
 * The shelf's filters: saved shelves ("Tudo", "Minha estante física"…), status, the genres in
 * your books and your tags. Any combination can be saved as a named shelf.
 */
export function ShelfFilterBar({ rows }: { rows: ShelfItem[] }) {
  const { filter, savedShelfId, toggle, apply, clear } = useShelfFilterStore();
  const tags = useShelfTags().data?.items ?? [];
  const saved = useSavedShelves().data?.items ?? [];
  const removeSaved = useRemoveSavedShelf();
  const saveShelf = useSaveShelf();
  const removeTag = useRemoveTag();
  const [moreGenres, setMoreGenres] = useState(false);
  const [saving, setSaving] = useState(false);
  const counts = countByShelf(rows.map(({ entry }) => entry));
  const genres = shelfGenres(rows);
  const shownGenres = moreGenres ? genres : genres.slice(0, GENRES_SHOWN);

  function savedMenu(shelf: (typeof saved)[number]) {
    Alert.alert(shelf.name, shelf.isPublic ? "Aparece no seu perfil." : "Só você vê.", [
      {
        text: shelf.isPublic ? "Deixar só para mim" : "Mostrar no perfil",
        onPress: () =>
          saveShelf.mutate(
            { id: shelf.id, name: shelf.name, filter: shelf.filter, isPublic: !shelf.isPublic },
            {
              onSuccess: () =>
                toast.saved(shelf.isPublic ? "Agora só você vê" : "Agora aparece no seu perfil"),
              onError: (error) => toast.failed(error),
            },
          ),
      },
      {
        text: "Apagar estante",
        style: "destructive",
        onPress: () => {
          if (savedShelfId === shelf.id) clear();
          removeSaved.mutate(shelf.id, {
            onSuccess: () => toast.saved(`Estante ${shelf.name} apagada`),
            onError: (error) => toast.failed(error),
          });
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function tagMenu(tag: (typeof tags)[number]) {
    Alert.alert(tag.name, "O marcador sai de todos os livros e das estantes salvas.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar marcador",
        style: "destructive",
        onPress: () => {
          if (filter.tagIds.includes(tag.id)) toggle("tagIds", tag.id);
          removeTag.mutate(tag.id, {
            onSuccess: () => toast.saved(`Marcador ${tag.name} apagado`),
            onError: (error) => toast.failed(error),
          });
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <Row>
        <Chip label="Tudo" active={isFilterEmpty(filter)} onPress={clear} />
        {saved.map((shelf) => (
          <Chip
            key={shelf.id}
            label={`${shelf.name}${shelf.isPublic ? "" : " · só eu"}`}
            active={savedShelfId === shelf.id}
            onPress={() =>
              savedShelfId === shelf.id ? savedMenu(shelf) : apply(shelf.filter, shelf.id)
            }
            accessibilityLabel={`Estante ${shelf.name}. Toque de novo para as opções.`}
          />
        ))}
      </Row>

      <Section label="Status">
        {SHELF_STATUSES.map((status) => (
          <Chip
            key={status}
            label={`${SHELF_LABELS[status]} ${counts[status]}`}
            active={filter.statuses.includes(status)}
            onPress={() => toggle("statuses", status)}
          />
        ))}
      </Section>

      {genres.length > 0 && (
        <Section label="Gênero">
          {shownGenres.map((genre) => (
            <Chip
              key={genre}
              label={GENRE_LABELS[genre as Genre] ?? genre}
              active={filter.genres.includes(genre)}
              onPress={() => toggle("genres", genre)}
            />
          ))}
          {genres.length > GENRES_SHOWN && (
            <Chip
              label={moreGenres ? "menos" : `+${genres.length - GENRES_SHOWN}`}
              onPress={() => setMoreGenres(!moreGenres)}
            />
          )}
        </Section>
      )}

      <Section label="Seus marcadores">
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            active={filter.tagIds.includes(tag.id)}
            onPress={() => toggle("tagIds", tag.id)}
            accessibilityLabel={`Marcador ${tag.name}`}
          />
        ))}
        <NewTag />
      </Section>
      {tags.length > 0 && (
        <Button
          variant="ghost"
          title="Apagar um marcador"
          onPress={() =>
            Alert.alert("Qual marcador?", undefined, [
              ...tags.map((tag) => ({ text: tag.name, onPress: () => tagMenu(tag) })),
              { text: "Cancelar", style: "cancel" as const },
            ])
          }
        />
      )}

      {!isFilterEmpty(filter) && savedShelfId === null && !saving && (
        <Button variant="secondary" title="Salvar como estante" onPress={() => setSaving(true)} />
      )}
      {saving && <SaveShelfForm onDone={() => setSaving(false)} />}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Row>{children}</Row>
    </View>
  );
}

/** Names the current filter and saves it: it then shows in "Tudo, …" and maybe on the profile. */
function SaveShelfForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { filter, apply } = useShelfFilterStore();
  const saveShelf = useSaveShelf();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const input = savedShelfSchema.safeParse({ name, filter, isPublic });
    if (!input.success) return setError(firstIssue(input.error));
    saveShelf.mutate(input.data, {
      onSuccess: ({ id }) => {
        apply(filter, id);
        toast.saved(`Estante ${input.data.name} salva`);
        onDone();
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <Text variant="label" color="textMuted">
        Salvar este filtro como estante
      </Text>
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Minha estante física"
        maxLength={40}
        autoFocus
      />
      <View style={styles.switchRow}>
        <View style={styles.grow}>
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
      {error && <Text color="danger">{error}</Text>}
      <View style={styles.switchRow}>
        <Button variant="ghost" title="Cancelar" onPress={onDone} />
        <Button title={saveShelf.isPending ? "Salvando…" : "Salvar estante"} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  row: { gap: spacing[2], alignItems: "center" },
  section: { gap: spacing[2] },
  form: { borderWidth: 1, borderRadius: 18, padding: spacing[4], gap: spacing[3] },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  grow: { flex: 1 },
});
