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
  BOOKCASE_COLOR_LABELS,
  BOOKCASE_COLORS,
  countByShelf,
  GENRE_LABELS,
  type Genre,
  matchesShelfFilter,
  SHELF_LABELS,
  SHELF_STATUSES,
  SHELF_VIEW_LABELS,
  SHELF_VIEWS,
  type ShelfView,
  shelfGenres,
} from "@grimo/core";
import { router } from "expo-router";
import { type ReactNode, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Button, Chip, Icon, SelectSheet, Text } from "@/components/ui";
import { bookcaseColors, radius, spacing } from "@/constants/theme";
import { useShelfNaming } from "@/features/books";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useShelfViewStore } from "@/lib/shelf-view";
import { ShelfBooks } from "./shelf-books";

/** The selector's value for "Todos os meus livros". */
const ALL = "all";

/**
 * Estantes: the shelf's name is the title and opens the shelf picker; beside it, filters (and
 * how to show the books) and ⋯ for the whole shelf. Holding a book starts selecting.
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
  const genres = shelfGenres(inShelf);
  const picking = shelves.find((item) => item.id === pickingFor) ?? null;
  const { view, setView, color, setColor } = useShelfViewStore();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const [sheet, setSheet] = useState<"shelf" | "filters" | null>(null);
  const activeFilters = filter.statuses.length + filter.genres.length;
  const allPicked = items.length > 0 && items.every((row) => selected.includes(row.entry.id));
  const books = `${inShelf.length} ${inShelf.length === 1 ? "livro" : "livros"}`;

  return (
    <View style={[styles.root, selecting && styles.roomForBar]}>
      {selecting ? (
        <View style={styles.selectionBar}>
          <Button
            variant="ghost"
            title="Cancelar"
            onPress={() => (picking ? store.openShelf(picking.id) : store.setSelecting(false))}
          />
          <Text variant="heading" style={styles.center}>
            {selected.length} {selected.length === 1 ? "escolhido" : "escolhidos"}
          </Text>
          <Button
            variant="ghost"
            title={allPicked ? "Nenhum" : "Todos"}
            onPress={() => store.selectAll(allPicked ? [] : items.map((row) => row.entry.id))}
          />
        </View>
      ) : (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Estante ${shelf ? shelf.name : "Todos os meus livros"}. Trocar de estante`}
            onPress={() => setSheet("shelf")}
            style={({ pressed }) => [styles.title, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text variant="label" color="textMuted">
              Estante
            </Text>
            <View style={styles.name}>
              <Text variant="display" numberOfLines={2} style={styles.shrink}>
                {shelf ? shelf.name : "Todos os meus livros"}
              </Text>
              <Icon name="chevronDown" size={20} />
            </View>
            <Text variant="small" color="textMuted">
              {shelf
                ? `${books} · ${shelf.isPublic ? "aparece no seu perfil" : "só você vê"}`
                : books}
            </Text>
          </Pressable>
          <IconButton
            label={activeFilters > 0 ? `Filtros, ${activeFilters} ativos` : "Filtros e exibição"}
            badge={activeFilters}
            onPress={() => setSheet("filters")}
          >
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </IconButton>
          {shelf && (
            <ShelfMenu
              shelf={shelf}
              onRename={() => naming.askRename(shelf)}
              onDuplicate={() =>
                naming.askDuplicate(shelf, (id) => {
                  store.openShelf(id);
                  store.setSelecting(true);
                })
              }
            />
          )}
        </View>
      )}

      {picking && (
        <Text color="textMuted">
          Escolha os livros para a estante {picking.name} e toque em Adicionar.
        </Text>
      )}
      {!selecting && activeFilters > 0 && (
        <Row>
          {filter.statuses.map((status) => (
            <Chip
              key={status}
              label={`${SHELF_LABELS[status]} ✕`}
              active
              onPress={() => store.toggle("statuses", status)}
            />
          ))}
          {filter.genres.map((genre) => (
            <Chip
              key={genre}
              label={`${GENRE_LABELS[genre as Genre] ?? genre} ✕`}
              active
              onPress={() => store.toggle("genres", genre)}
            />
          ))}
          <Chip label="Limpar" onPress={store.clearFilter} />
        </Row>
      )}

      <SelectSheet
        visible={sheet === "shelf"}
        title="Estantes"
        value={shelfId ?? ALL}
        options={[
          { value: ALL, label: "Todos os meus livros", detail: String(rows.length) },
          ...shelves.map((item) => ({
            value: item.id,
            label: item.name,
            detail: String(item.count),
            hint: item.isPublic ? "aparece no seu perfil" : "só você vê",
          })),
        ]}
        onSelect={(value) => store.openShelf(value === ALL ? null : value)}
        onClose={() => setSheet(null)}
        footer={
          <Button
            variant="secondary"
            title="+ Nova estante"
            onPress={() => {
              setSheet(null);
              naming.askNew([], store.openShelf);
            }}
          />
        }
      />
      <SelectSheet
        visible={sheet === "filters"}
        title="Filtros e exibição"
        onClose={() => setSheet(null)}
        footer={
          <View style={styles.footer}>
            <Button variant="ghost" title="Limpar" onPress={store.clearFilter} />
            <Button title={`Ver ${items.length} livros`} onPress={() => setSheet(null)} />
          </View>
        }
      >
        <Group label="Mostrar como">
          <View style={styles.views}>
            {SHELF_VIEWS.map((option) => (
              <ViewOption
                key={option}
                view={option}
                active={view === option}
                onPress={() => setView(option)}
              />
            ))}
          </View>
        </Group>
        <Group label="Cor da estante">
          <View style={styles.wrap}>
            {BOOKCASE_COLORS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={`Estante ${BOOKCASE_COLOR_LABELS[option]}`}
                accessibilityState={{ selected: color === option }}
                onPress={() => setColor(option)}
                style={({ pressed }) => [
                  styles.swatch,
                  {
                    backgroundColor: bookcaseColors[scheme][option].back,
                    borderColor:
                      color === option ? theme.text : bookcaseColors[scheme][option].wall,
                    borderWidth: color === option ? 3 : 4,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </Group>
        <Group label="Situação">
          <View style={styles.wrap}>
            {SHELF_STATUSES.map((status) => (
              <Chip
                key={status}
                label={`${SHELF_LABELS[status]} ${counts[status]}`}
                active={filter.statuses.includes(status)}
                onPress={() => store.toggle("statuses", status)}
              />
            ))}
          </View>
        </Group>
        {genres.length > 0 && (
          <Group label="Gênero">
            <View style={styles.wrap}>
              {genres.map((genre) => (
                <Chip
                  key={genre}
                  label={GENRE_LABELS[genre as Genre] ?? genre}
                  active={filter.genres.includes(genre)}
                  onPress={() => store.toggle("genres", genre)}
                />
              ))}
            </View>
          </Group>
        )}
      </SelectSheet>

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
      {!selecting && items.length > 1 && (
        <Text variant="small" color="textMuted">
          Segure um livro para escolher vários.
        </Text>
      )}

      <ShelfBooks
        items={items}
        view={view}
        selecting={selecting}
        selected={selected}
        onPress={({ entry, book }) =>
          selecting
            ? store.toggleSelected(entry.id)
            : router.push({ pathname: "/book/[id]", params: { id: book.openLibraryId } })
        }
        onLongPress={({ entry }) =>
          selecting ? store.toggleSelected(entry.id) : store.startSelecting(entry.id)
        }
      />
      {naming.dialog}
    </View>
  );
}

/** A round icon button beside the shelf's title, with an optional count. */
function IconButton({
  label,
  badge = 0,
  onPress,
  children,
}: {
  label: string;
  badge?: number;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.icon,
        { borderColor: theme.border, backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.text}
        strokeWidth={2}
        strokeLinecap="round"
      >
        {children}
      </Svg>
      {badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text variant="small" color="accentForeground" style={styles.badgeText}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** "Mostrar como": a small drawing of each view. */
function ViewOption({
  view,
  active,
  onPress,
}: {
  view: ShelfView;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const shapes =
    view === "spines"
      ? [
          { w: 8, h: 36, c: theme.inverse },
          { w: 6, h: 30, c: theme.accentStart },
          { w: 10, h: 40, c: theme.accent },
          { w: 7, h: 33, c: theme.ornament },
        ]
      : [
          { w: 24, h: 36, c: theme.accentStart },
          { w: 24, h: 36, c: theme.accent },
        ];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.viewOption,
        {
          borderColor: active ? theme.accent : theme.border,
          borderWidth: active ? 2 : 1,
          backgroundColor: active ? theme.glowB : theme.surface,
        },
      ]}
    >
      <View style={styles.drawing}>
        {shapes.map((shape, i) => (
          <View
            key={i}
            style={{ width: shape.w, height: shape.h, backgroundColor: shape.c, borderRadius: 2 }}
          />
        ))}
      </View>
      <Text style={active && styles.bold}>{SHELF_VIEW_LABELS[view]}</Text>
    </Pressable>
  );
}

/** ⋯ beside the open shelf: everything you can do with the whole shelf. */
function ShelfMenu({
  shelf,
  onRename,
  onDuplicate,
}: {
  shelf: MyShelf;
  onRename: () => void;
  onDuplicate: () => void;
}) {
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
    <IconButton label={`Opções da estante ${shelf.name}`} onPress={menu}>
      <Path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
    </IconButton>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      {children}
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
  root: { gap: spacing[4] },
  /** Room under the books for the floating selection bar. */
  roomForBar: { paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  title: { flex: 1, gap: 2 },
  name: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  shrink: { flexShrink: 1 },
  selectionBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  center: { flex: 1, textAlign: "center" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, lineHeight: 14 },
  row: { gap: spacing[2], alignItems: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  swatch: { width: 44, height: 44, borderRadius: radius.md },
  group: { gap: spacing[2], paddingTop: spacing[3] },
  views: { flexDirection: "row", gap: spacing[2] },
  viewOption: {
    flex: 1,
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  drawing: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 40 },
  bold: { fontWeight: "700" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  empty: { gap: spacing[3], alignItems: "flex-start" },
});
