import {
  type MyShelf,
  toast,
  useCreateShelf,
  useMyShelves,
  useRemoveShelf,
  useSetShelfPublic,
  useShelf,
  useShelfScreenStore,
} from "@grimo/client";
import {
  countByShelf,
  GENRE_LABELS,
  type Genre,
  matchesShelfFilter,
  SHELF_LABELS,
  SHELF_STATUSES,
  shelfGenres,
} from "@grimo/core";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover, useShelfNaming } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";
import { ShelfSelectBar } from "./shelf-select-bar";

const TILE = 100;

/**
 * Estantes: "Todos os meus livros" and the shelves you made ("Física", "Kindle"), each filtered
 * by status and genre. "Selecionar" acts on several books; ⋯ acts on the whole shelf.
 */
export function ShelfBoard() {
  const theme = useTheme();
  const all = useShelf();
  const shelves = useMyShelves().data?.items ?? [];
  const store = useShelfScreenStore();
  const { shelfId, filter, selecting, selected, pickingFor } = store;
  const naming = useShelfNaming();
  const shelf = shelves.find((item) => item.id === shelfId) ?? null;
  const rows = all.data?.items ?? [];
  const inShelf = shelf ? rows.filter((row) => row.entry.tagIds.includes(shelf.id)) : rows;
  const items = inShelf.filter((row) => matchesShelfFilter(row, { ...filter, tagIds: [] }));
  const counts = countByShelf(inShelf.map(({ entry }) => entry));
  const genres = shelfGenres(inShelf).slice(0, 10);
  const picking = shelves.find((item) => item.id === pickingFor) ?? null;

  return (
    <View style={styles.root}>
      <Row>
        <Chip
          label={`Todos os meus livros ${rows.length}`}
          active={shelfId === null}
          onPress={() => store.openShelf(null)}
        />
        {shelves.map((item) => (
          <Chip
            key={item.id}
            label={`${item.name} ${item.count}`}
            active={item.id === shelfId}
            onPress={() => store.openShelf(item.id)}
          />
        ))}
        <Chip label="+ Nova estante" onPress={() => naming.askNew([], store.openShelf)} />
      </Row>

      {picking ? (
        <Text color="textMuted">
          Escolha os livros para a estante {picking.name} e toque em Adicionar.
        </Text>
      ) : (
        shelf && (
          <ShelfHeader
            shelf={shelf}
            onRename={() => naming.askRename(shelf)}
            onDuplicate={() =>
              naming.askDuplicate(shelf, (id) => {
                store.openShelf(id);
                store.setSelecting(true);
              })
            }
          />
        )
      )}

      <Row>
        {SHELF_STATUSES.map((status) => (
          <Chip
            key={status}
            label={`${SHELF_LABELS[status]} ${counts[status]}`}
            active={filter.statuses.includes(status)}
            onPress={() => store.toggle("statuses", status)}
          />
        ))}
      </Row>
      {genres.length > 0 && (
        <Row>
          {genres.map((genre) => (
            <Chip
              key={genre}
              label={GENRE_LABELS[genre as Genre] ?? genre}
              active={filter.genres.includes(genre)}
              onPress={() => store.toggle("genres", genre)}
            />
          ))}
        </Row>
      )}

      <View style={styles.between}>
        <Text variant="label" color="textMuted">
          {items.length} {items.length === 1 ? "livro" : "livros"}
        </Text>
        {items.length > 0 && !picking && (
          <Button
            variant="ghost"
            title={selecting ? "Cancelar" : "Selecionar"}
            onPress={() => store.setSelecting(!selecting)}
          />
        )}
      </View>
      {selecting && items.length > 0 && (
        <Button
          variant="secondary"
          title={
            items.every((row) => selected.includes(row.entry.id))
              ? "Desmarcar todos"
              : `Selecionar todos (${items.length})`
          }
          onPress={() =>
            store.selectAll(
              items.every((row) => selected.includes(row.entry.id))
                ? []
                : items.map((row) => row.entry.id),
            )
          }
        />
      )}

      {all.isPending && <ActivityIndicator color={theme.accent} />}
      {!all.isPending && rows.length === 0 && (
        <Text color="textMuted">Nenhum livro aqui ainda. Use a busca para adicionar.</Text>
      )}
      {shelf && inShelf.length === 0 && !selecting && (
        <View style={styles.empty}>
          <Text color="textMuted">A estante {shelf.name} ainda está vazia.</Text>
          <Button title="Escolher livros" onPress={() => store.pickBooksFor(shelf.id)} />
        </View>
      )}
      {inShelf.length > 0 && items.length === 0 && (
        <Text color="textMuted">Nenhum livro com esses filtros.</Text>
      )}

      <View style={styles.grid}>
        {items.map(({ entry, book }) => {
          const picked = selected.includes(entry.id);
          return (
            <Pressable
              key={entry.id}
              accessibilityRole={selecting ? "checkbox" : "button"}
              accessibilityState={selecting ? { checked: picked } : undefined}
              accessibilityLabel={book.title}
              onPress={() =>
                selecting
                  ? store.toggleSelected(entry.id)
                  : router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
              }
              style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View>
                <BookCover src={book.coverUrl} title={book.title} width={TILE} />
                {selecting && (
                  <View
                    style={[
                      styles.check,
                      {
                        backgroundColor: picked ? theme.accent : theme.glass,
                        borderColor: picked ? theme.accent : theme.glassBorder,
                      },
                    ]}
                  >
                    {picked && (
                      <Text variant="label" color="accentForeground">
                        ✓
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <Text variant="small" numberOfLines={2}>
                {book.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selecting && (
        <ShelfSelectBar
          current={shelf}
          picking={picking}
          onNewShelf={(entryIds) =>
            naming.askNew(entryIds, (id) => {
              store.openShelf(id);
            })
          }
        />
      )}
      {naming.dialog}
    </View>
  );
}

/** The open shelf: its name, who sees it, and ⋯ for the whole shelf. */
function ShelfHeader({
  shelf,
  onRename,
  onDuplicate,
}: {
  shelf: MyShelf;
  onRename: () => void;
  onDuplicate: () => void;
}) {
  const theme = useTheme();
  const setPublic = useSetShelfPublic();
  const remove = useRemoveShelf();
  const create = useCreateShelf();
  const { openShelf } = useShelfScreenStore();

  function menu() {
    Alert.alert(shelf.name, undefined, [
      { text: "Renomear", onPress: onRename },
      { text: "Duplicar", onPress: onDuplicate },
      {
        text: shelf.isPublic ? "Deixar só para mim" : "Mostrar no perfil",
        onPress: () => {
          setPublic.mutate(
            { id: shelf.id, isPublic: !shelf.isPublic },
            { onError: (error) => toast.failed(error) },
          );
          toast.saved(shelf.isPublic ? "Agora só você vê" : "Agora aparece no seu perfil");
        },
      },
      {
        text: "Apagar estante",
        style: "destructive",
        onPress: () =>
          remove.mutate(shelf.id, {
            onSuccess: ({ entryIds, name }) => {
              openShelf(null);
              toast.saved(`Estante ${name} apagada. Os livros continuam nas suas leituras.`, {
                label: "Desfazer",
                run: () =>
                  create.mutate(
                    { name, isPublic: shelf.isPublic, entryIds },
                    {
                      onSuccess: ({ id }) => openShelf(id),
                      onError: (error) => toast.failed(error),
                    },
                  ),
              });
            },
            onError: (error) => toast.failed(error),
          }),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <View style={styles.grow}>
        <Text variant="heading" numberOfLines={1}>
          {shelf.name}
        </Text>
        <Text variant="small" color="textMuted">
          {shelf.count} {shelf.count === 1 ? "livro" : "livros"} ·{" "}
          {shelf.isPublic ? "aparece no seu perfil" : "só você vê"}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Opções da estante ${shelf.name}`}
        onPress={menu}
        hitSlop={8}
        style={[styles.more, { borderColor: theme.border }]}
      >
        <Text variant="heading">⋯</Text>
      </Pressable>
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[3] },
  row: { gap: spacing[2], alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[3],
  },
  grow: { flex: 1, gap: 2 },
  more: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { gap: spacing[3], alignItems: "flex-start" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
    justifyContent: "space-between",
  },
  tile: { width: TILE, gap: spacing[1] },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
