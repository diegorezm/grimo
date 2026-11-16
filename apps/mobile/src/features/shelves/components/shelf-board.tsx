import {
  type MyShelf,
  type ShelfItem,
  toast,
  useCreateShelf,
  useMyShelves,
  useRemoveShelf,
  useSetShelfOrder,
  useSetShelfPublic,
  useSetShelfStyle,
  useShelf,
  useShelfDecor,
  useShelfScreenStore,
} from "@grimo/client";
import {
  countByShelf,
  DEFAULT_SHELF_STYLE,
  type DecorLevels,
  GENRE_LABELS,
  type Genre,
  matchesShelfFilter,
  moveInOrder,
  SHELF_LABELS,
  SHELF_MATERIAL_LABELS,
  SHELF_MODEL_LABELS,
  SHELF_STATUSES,
  type ShelfStyle,
  sameStyle,
  shelfOrderOf,
} from "@grimo/core";
import { useIsFocused } from "expo-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SensorType,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Button, Chip, Glass, Icon, SelectSheet, Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { useShelfNaming } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";
import { useFirstVisit } from "@/lib/motion";
import { Bookcase } from "../bookcase/bookcase";
import { materialOf } from "../bookcase/look";
import { BookcaseThumb } from "../bookcase/thumb";
import { BookPeek } from "./book-peek";
import { CustomizeSheet, useCustomizeSheetHeights } from "./customize-sheet";
import { ShelfieSheet } from "./shelfie-sheet";

/** One page of the pager: "Todos os meus livros" (no id) or a shelf you made. */
interface Page {
  id: string | null;
  name: string;
  style: ShelfStyle;
  /** The reader's own order of its books ("Do meu jeito"). */
  order: string[];
  shelf: MyShelf | null;
  items: ShelfItem[];
}

/** Height of the floating header (under the status bar). */
const HEADER = 64;
/** The shelves beside the open one show this much at the screen's edges, after a gap. */
const PEEK = 14;
const PAGE_GAP = 6;
/** Seen from afar (a pinch): the bookcase at this scale, so more shelves fit. */
const FAR = 0.6;

const bookOf = (row: ShelfItem) => ({
  key: row.entry.id,
  title: row.book.title,
  pageCount: row.book.pageCount,
  color: row.spine?.base,
});

const booksLabel = (n: number) => `${n} ${n === 1 ? "livro" : "livros"}`;

/**
 * Estantes: the bookcase is the screen. Swipe sideways between your shelves ("Todos os meus
 * livros" first; the ones beside show at the edges), scroll down a tall one, pinch to see it
 * from afar. Floating on top: the shelf's name (opens the list of shelves), filters, ⋯ (arrange
 * by hand, share a picture, the shelf's options) and "Personalizar", which shrinks the bookcase
 * over the editor so every change shows on the whole piece. Tapping a book takes it off the
 * shelf; holding one starts selecting.
 */
export function ShelfBoard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const firstVisit = useFirstVisit("shelves");
  const all = useShelf();
  const mine = useMyShelves();
  const shelves = mine.data?.items ?? [];
  const store = useShelfScreenStore();
  const { shelfId, filter, selecting, selected, pickingFor } = store;
  const naming = useShelfNaming();
  const setStyle = useSetShelfStyle();
  const setOrder = useSetShelfOrder();
  const decor = useShelfDecor().data?.progress;
  const decorLevels = useMemo(
    () =>
      decor &&
      (Object.fromEntries(
        Object.entries(decor).map(([name, progress]) => [name, progress.level]),
      ) as DecorLevels),
    [decor],
  );
  // "Arrumar com a mão": the order being made (entry ids) and the steps to undo.
  const [arranging, setArranging] = useState<string[] | null>(null);
  const [undo, setUndo] = useState<string[][]>([]);
  const [dragging, setDragging] = useState(false);
  const [far, setFar] = useState(false);
  const [tall, setTall] = useState<Record<string, number>>({});
  const [sharing, setSharing] = useState(false);
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const tilt = useSharedValue(0);
  const [sheet, setSheet] = useState<"shelf" | "filters" | null>(null);
  const [editing, setEditing] = useState<ShelfStyle | null>(null);
  const [customizeNext, setCustomizeNext] = useState<string | null>(null);
  const [peek, setPeek] = useState<ShelfItem | null>(null);
  const [landing, setLanding] = useState(0);
  const pager = useRef<FlatList<Page>>(null);

  const rows = all.data?.items ?? [];
  const pages = useMemo<Page[]>(() => {
    const visible = (list: ShelfItem[]) =>
      list.filter((row) => matchesShelfFilter(row, { ...filter, tagIds: [] }));
    return [
      {
        id: null,
        name: "Todos os meus livros",
        style: mine.data?.all?.style ?? DEFAULT_SHELF_STYLE,
        order: mine.data?.all?.order ?? [],
        shelf: null,
        items: visible(rows),
      },
      ...shelves.map((shelf) => ({
        id: shelf.id,
        name: shelf.name,
        style: shelf.style ?? DEFAULT_SHELF_STYLE,
        order: shelf.order ?? [],
        shelf,
        items: visible(rows.filter((row) => row.entry.tagIds.includes(shelf.id))),
      })),
    ];
  }, [rows, shelves, filter, mine.data]);
  const index = Math.max(
    0,
    pages.findIndex((page) => page.id === shelfId),
  );
  const page = pages[index]!;
  const inPage = page.id ? rows.filter((row) => row.entry.tagIds.includes(page.id!)) : rows;
  const counts = countByShelf(inPage.map(({ entry }) => entry));
  const activeFilters = filter.statuses.length + filter.genres.length;
  const allPicked =
    page.items.length > 0 && page.items.every((row) => selected.includes(row.entry.id));
  const picking = shelves.find((shelf) => shelf.id === pickingFor) ?? null;

  // Each shelf is a little narrower than the screen, so its neighbors show at the edges.
  const pageWidth = width - PEEK * 2;
  const step = pageWidth + PAGE_GAP;
  const zoom = far && !editing && !arranging ? FAR : 1;
  const readThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    return rows.filter(
      ({ entry }) =>
        entry.status === "read" &&
        entry.finishedAt !== null &&
        new Date(entry.finishedAt).getFullYear() === year,
    ).length;
  }, [rows]);

  // The pager follows the open shelf when it changes elsewhere (the list, a new shelf).
  useEffect(() => {
    pager.current?.scrollToOffset({ offset: index * step, animated: false });
  }, [index, step]);

  // A new shelf opens straight into "Personalizar" once it arrives.
  useEffect(() => {
    if (!customizeNext || page.id !== customizeNext) return;
    setCustomizeNext(null);
    setEditing(page.style);
  }, [customizeNext, page]);

  // While editing the bookcase stays still and full size; it scrolls in the room above the
  // sheet, and only the header fades away.
  const top = insets.top + HEADER;
  const sheetHeights = useCustomizeSheetHeights();
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(editing ? 1 : 0, { duration: 200 });
  }, [editing, fade]);
  const chrome = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));

  function changeStyle(next: ShelfStyle) {
    if (
      editing &&
      (next.model !== editing.model || next.layout !== editing.layout || next.sort !== editing.sort)
    ) {
      setLanding((n) => n + 1);
    }
    setEditing(next);
  }

  function doneEditing() {
    if (editing && !sameStyle(editing, page.style)) {
      setStyle.mutate(
        { id: page.id ?? undefined, style: editing },
        { onError: (error) => toast.failed(error) },
      );
      toast.saved("Estante do seu jeito");
    }
    setEditing(null);
  }

  function startArranging() {
    store.clearFilter();
    store.setSelecting(false);
    setArranging(shelfOrderOf(inPage.map(bookOf), page.style, page.order));
    setUndo([]);
  }

  function moveBook(key: string, before: string | null) {
    if (!arranging) return;
    const next = moveInOrder(arranging, key, before);
    if (next.every((id, i) => id === arranging[i])) return;
    setUndo([...undo, arranging]);
    setArranging(next);
  }

  function doneArranging() {
    if (arranging && undo.length > 0) {
      const id = page.id ?? undefined;
      const failed = { onError: (error: unknown) => toast.failed(error) };
      setOrder.mutate({ id, entryIds: arranging }, failed);
      if (page.style.sort !== "manual") {
        setStyle.mutate({ id, style: { ...page.style, sort: "manual" } }, failed);
      }
      toast.saved("Estante arrumada do seu jeito");
    }
    setArranging(null);
    setUndo([]);
    setDragging(false);
  }

  // Two fingers apart or together: the bookcase from near or from afar.
  const pinch = useMemo(
    () =>
      Gesture.Pinch().onEnd((event) => {
        if (event.scale < 0.85) runOnJS(setFar)(true);
        else if (event.scale > 1.15) runOnJS(setFar)(false);
      }),
    [],
  );

  function emptyFor(target: Page): ReactNode {
    if (all.isPending) return <ActivityIndicator color={theme.accent} />;
    const ink = { color: materialOf(target.style).ink };
    if (rows.length === 0) {
      return (
        <Text style={[styles.emptyText, ink]}>Nenhum livro ainda. Use a busca para adicionar.</Text>
      );
    }
    if (target.shelf && target.items.length === 0 && activeFilters === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, ink]}>Os livros chegam aqui.</Text>
          <Button title="Escolher livros" onPress={() => store.pickBooksFor(target.shelf!.id)} />
        </View>
      );
    }
    if (target.items.length === 0) {
      return <Text style={[styles.emptyText, ink]}>Nenhum livro com esses filtros.</Text>;
    }
    return null;
  }

  return (
    <View style={[styles.root, { backgroundColor: materialOf(editing ?? page.style).room }]}>
      {focused && !reduceMotion && <Tilt value={tilt} />}
      <GestureDetector gesture={pinch}>
        <Animated.View style={[styles.root, styles.clip]}>
          <FlatList
            ref={pager}
            data={pages}
            horizontal
            snapToInterval={step}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEnabled={!selecting && !editing && !arranging}
            keyExtractor={(item) => item.id ?? "all"}
            initialScrollIndex={index}
            contentContainerStyle={{ paddingHorizontal: PEEK, gap: PAGE_GAP }}
            getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
            windowSize={3}
            onMomentumScrollEnd={(event) => {
              const next = pages[Math.round(event.nativeEvent.contentOffset.x / step)];
              if (next && next.id !== shelfId) store.openShelf(next.id);
            }}
            renderItem={({ item, index: i }) => {
              const active = i === index;
              const sorting = active && arranging !== null;
              const base = active && editing ? editing : item.style;
              const style = sorting ? { ...base, sort: "manual" as const } : base;
              const key = item.id ?? "all";
              const scaled = zoom !== 1;
              return (
                <ScrollView
                  style={{ width: pageWidth, backgroundColor: materialOf(style).room }}
                  showsVerticalScrollIndicator={false}
                  contentInsetAdjustmentBehavior="never"
                  scrollEnabled={!dragging}
                  contentContainerStyle={
                    active && editing
                      ? { paddingBottom: sheetHeights.compact - insets.bottom }
                      : undefined
                  }
                >
                  {/* From afar the bookcase is drawn wider and scaled down to the page. */}
                  <View
                    pointerEvents={active && editing ? "none" : "auto"}
                    style={
                      scaled
                        ? { height: (tall[key] ?? height / zoom) * zoom, overflow: "hidden" }
                        : undefined
                    }
                  >
                    <View
                      onLayout={
                        scaled
                          ? ({ nativeEvent }) => {
                              const measured = Math.round(nativeEvent.layout.height);
                              if (tall[key] !== measured) setTall({ ...tall, [key]: measured });
                            }
                          : undefined
                      }
                      style={
                        scaled
                          ? {
                              width: pageWidth / zoom,
                              transform: [{ scale: zoom }],
                              transformOrigin: "left top",
                            }
                          : undefined
                      }
                    >
                      <Bookcase
                        key={active ? `${item.id}-${landing}` : key}
                        items={item.items}
                        style={style}
                        order={sorting ? arranging : item.order}
                        decorLevels={decorLevels}
                        tilt={active ? tilt : undefined}
                        width={pageWidth / zoom}
                        minHeight={height / zoom}
                        top={top / zoom}
                        bottom={(insets.bottom + 40) / zoom}
                        name={item.name}
                        selecting={active && selecting}
                        selected={selected}
                        arranging={sorting}
                        onMove={moveBook}
                        onDragging={setDragging}
                        animate={active && (firstVisit || landing > 0)}
                        empty={emptyFor(item)}
                        onPress={(row) =>
                          selecting ? store.toggleSelected(row.entry.id) : setPeek(row)
                        }
                        onLongPress={(row) =>
                          selecting
                            ? store.toggleSelected(row.entry.id)
                            : store.startSelecting(row.entry.id)
                        }
                      />
                    </View>
                  </View>
                </ScrollView>
              );
            }}
          />
        </Animated.View>
      </GestureDetector>

      <Animated.View
        pointerEvents={editing ? "none" : "box-none"}
        style={[styles.header, { paddingTop: insets.top + spacing[2] }, chrome]}
      >
        {arranging ? (
          <Glass style={styles.selectionBar}>
            <Button
              variant="ghost"
              title="Desfazer"
              disabled={undo.length === 0}
              onPress={() => {
                setArranging(undo[undo.length - 1] ?? arranging);
                setUndo(undo.slice(0, -1));
              }}
            />
            <Text variant="title" style={styles.center}>
              Do meu jeito
            </Text>
            <Button title="Pronto" onPress={doneArranging} />
          </Glass>
        ) : selecting ? (
          <Glass style={styles.selectionBar}>
            <Button
              variant="ghost"
              title="Cancelar"
              onPress={() => (picking ? store.openShelf(picking.id) : store.setSelecting(false))}
            />
            <Text variant="title" style={styles.center}>
              {selected.length} {selected.length === 1 ? "escolhido" : "escolhidos"}
            </Text>
            <Button
              variant="ghost"
              title={allPicked ? "Nenhum" : "Todos"}
              onPress={() =>
                store.selectAll(allPicked ? [] : page.items.map((row) => row.entry.id))
              }
            />
          </Glass>
        ) : (
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Estante ${page.name}. Trocar de estante`}
              onPress={() => setSheet("shelf")}
              style={({ pressed }) => [styles.grow, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Glass style={styles.namePill}>
                <View style={styles.grow}>
                  <Text variant="title" numberOfLines={1}>
                    {page.name}
                  </Text>
                  <Text variant="small" color="textMuted" numberOfLines={1}>
                    {booksLabel(inPage.length)} ·{" "}
                    {SHELF_MODEL_LABELS[page.style.model].name.toLowerCase()} ·{" "}
                    {SHELF_MATERIAL_LABELS[page.style.material].name.toLowerCase()}
                    {page.shelf ? (page.shelf.isPublic ? " · no perfil" : " · só você") : ""}
                  </Text>
                </View>
                <Icon name="chevronDown" size={18} />
              </Glass>
            </Pressable>
            <RoundButton
              label={activeFilters > 0 ? `Filtros, ${activeFilters} ativos` : "Filtros"}
              badge={activeFilters}
              onPress={() => setSheet("filters")}
            >
              <Path d="M4 6h16M7 12h10M10 18h4" />
            </RoundButton>
            <BoardMenu
              name={page.name}
              shelf={page.shelf}
              naming={naming}
              far={far}
              canArrange={inPage.length > 1}
              onArrange={startArranging}
              onShare={() => setSharing(true)}
              onZoom={() => setFar(!far)}
            />
            <RoundButton
              label="Personalizar estante"
              primary
              onPress={() => setEditing(page.style)}
            >
              <Path d="M4 20c3 0 5-1.5 5-4a3 3 0 0 0-3-3c-2 0-3 1.5-3 3.5C3 18 3.5 19 4 20zM9.5 12.5L19 3l2 2-9.5 9.5" />
            </RoundButton>
          </View>
        )}
        {arranging && (
          <Glass style={styles.note}>
            <Text variant="small">Segure um livro e arraste até o lugar dele.</Text>
          </Glass>
        )}
        {picking && (
          <Glass style={styles.note}>
            <Text variant="small">
              Escolha os livros para a estante {picking.name} e toque em Adicionar.
            </Text>
          </Glass>
        )}
        {!selecting && !arranging && activeFilters > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
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
          </ScrollView>
        )}
      </Animated.View>

      {pages.length > 1 && !selecting && !arranging && (
        <Animated.View
          pointerEvents="none"
          style={[styles.dotsDock, { bottom: insets.bottom + 64 }, chrome]}
        >
          <Glass style={styles.dots}>
            {pages.map((item, i) => (
              <View
                key={item.id ?? "all"}
                style={[
                  styles.dot,
                  {
                    width: i === index ? 18 : 6,
                    backgroundColor: i === index ? theme.accent : theme.border,
                  },
                ]}
              />
            ))}
          </Glass>
        </Animated.View>
      )}

      {editing && (
        <CustomizeSheet
          style={editing}
          titles={inPage.slice(0, 15).map((row) => row.book.title)}
          decor={decor}
          onChange={changeStyle}
          onDone={doneEditing}
        />
      )}

      <SelectSheet
        visible={sheet === "shelf"}
        title="Minhas estantes"
        onClose={() => setSheet(null)}
      >
        <View style={styles.shelfGrid}>
          {pages.map((item) => {
            const active = item.id === page.id;
            const count = item.id
              ? rows.filter((row) => row.entry.tagIds.includes(item.id!)).length
              : rows.length;
            return (
              <Pressable
                key={item.id ?? "all"}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  store.openShelf(item.id);
                  setSheet(null);
                }}
                style={({ pressed }) => [styles.shelfCard, { opacity: pressed ? 0.75 : 1 }]}
              >
                <BookcaseThumb
                  style={item.style}
                  titles={item.items.slice(0, 15).map((row) => row.book.title)}
                  height={104}
                  ring={active ? theme.accent : undefined}
                />
                <Text style={styles.bold} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="small" color="textMuted">
                  {booksLabel(count)}
                  {item.shelf ? (item.shelf.isPublic ? " · no perfil" : " · só você") : ""}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSheet(null);
              naming.askNew([], (id) => {
                store.openShelf(id);
                setCustomizeNext(id);
              });
            }}
            style={({ pressed }) => [styles.shelfCard, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={[styles.newShelf, { borderColor: theme.border }]}>
              <Text variant="heading" color="accentInk">
                +
              </Text>
            </View>
            <Text style={styles.bold}>Nova estante</Text>
            <Text variant="small" color="textMuted">
              do seu jeito
            </Text>
          </Pressable>
        </View>
      </SelectSheet>

      <SelectSheet
        visible={sheet === "filters"}
        title="Filtros"
        onClose={() => setSheet(null)}
        footer={
          <View style={styles.footer}>
            <Button variant="ghost" title="Limpar" onPress={store.clearFilter} />
            <Button title={`Ver ${booksLabel(page.items.length)}`} onPress={() => setSheet(null)} />
          </View>
        }
      >
        <View style={styles.group}>
          <Text variant="label" color="textMuted">
            Situação
          </Text>
          <View style={styles.statusGrid}>
            {SHELF_STATUSES.map((status) => {
              const active = filter.statuses.includes(status);
              return (
                <Pressable
                  key={status}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  onPress={() => store.toggle("statuses", status)}
                  style={[
                    styles.statusCell,
                    active
                      ? { backgroundColor: theme.glowB, borderColor: theme.accent, borderWidth: 2 }
                      : { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <Text style={active && styles.bold}>{SHELF_LABELS[status]}</Text>
                  <Text variant="label">{counts[status]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SelectSheet>

      <BookPeek item={peek} onClose={() => setPeek(null)} />
      <ShelfieSheet
        shelf={sharing ? page : null}
        decorLevels={decorLevels}
        readThisYear={readThisYear}
        onClose={() => setSharing(false)}
      />
      {naming.dialog}
    </View>
  );
}

/**
 * How the phone is tilted sideways, -1..1, eased: the shelves shift a little inside the frame
 * (depth). Mounted only while the screen shows, so the sensor rests otherwise.
 */
function Tilt({ value }: { value: SharedValue<number> }) {
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 60 });
  useAnimatedReaction(
    () => Math.max(-1, Math.min(1, gravity.sensor.value.x / 4)),
    (lean) => {
      value.value = withSpring(lean, { damping: 22, stiffness: 80 });
    },
  );
  useEffect(
    () => () => {
      value.value = 0;
    },
    [value],
  );
  return null;
}

/** A round glass button in the header; `primary` is the rose → lavender one. */
function RoundButton({
  label,
  badge = 0,
  primary = false,
  onPress,
  children,
}: {
  label: string;
  badge?: number;
  primary?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const icon = (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={primary ? theme.accentForeground : theme.text}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {primary ? (
        <View
          style={[
            styles.round,
            {
              backgroundImage: `linear-gradient(135deg, ${theme.accentStart} 0%, ${theme.accent} 100%)`,
            },
          ]}
        >
          {icon}
        </View>
      ) : (
        <Glass style={styles.round}>{icon}</Glass>
      )}
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

/**
 * ⋯ on a shelf: arrange it by hand, share its picture, see it from afar; on a shelf you made,
 * also rename, duplicate, show on the profile or not, delete.
 */
function BoardMenu({
  name,
  shelf,
  naming,
  far,
  canArrange,
  onArrange,
  onShare,
  onZoom,
}: {
  name: string;
  shelf: MyShelf | null;
  naming: ReturnType<typeof useShelfNaming>;
  far: boolean;
  canArrange: boolean;
  onArrange: () => void;
  onShare: () => void;
  onZoom: () => void;
}) {
  const setPublic = useSetShelfPublic();
  const remove = useRemoveShelf();
  const create = useCreateShelf();
  const store = useShelfScreenStore();

  function menu() {
    const board = [
      ...(canArrange ? [{ text: "Arrumar com a mão", onPress: onArrange }] : []),
      { text: "Compartilhar estante", onPress: onShare },
      { text: far ? "Ver de perto" : "Ver de longe", onPress: onZoom },
    ];
    if (!shelf) {
      Alert.alert(name, undefined, [...board, { text: "Cancelar", style: "cancel" }]);
      return;
    }
    Alert.alert(shelf.name, undefined, [
      ...board,
      { text: "Renomear", onPress: () => naming.askRename(shelf) },
      {
        text: "Duplicar",
        onPress: () =>
          naming.askDuplicate(shelf, (id) => {
            store.openShelf(id);
            store.setSelecting(true);
          }),
      },
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
            onSuccess: ({ entryIds, name, style }) => {
              store.openShelf(null);
              toast.saved(`Estante ${name} apagada. Os livros continuam nas suas leituras.`, {
                label: "Desfazer",
                run: () =>
                  create.mutate(
                    { name, isPublic: shelf.isPublic, entryIds, style },
                    {
                      onSuccess: ({ id }) => store.openShelf(id),
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
    <RoundButton label={`Opções da estante ${name}`} onPress={menu}>
      <Path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
    </RoundButton>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  clip: { overflow: "hidden", transformOrigin: "top" },
  grow: { flex: 1, minWidth: 0 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  namePill: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: 18,
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: 18,
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
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    borderRadius: 18,
  },
  center: { flex: 1, textAlign: "center" },
  note: { padding: spacing[3], borderRadius: radius.md },
  chips: { gap: spacing[2], alignItems: "center" },
  dotsDock: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 5 },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  dot: { height: 6, borderRadius: 3 },
  emptyBox: { alignItems: "center", gap: spacing[3] },
  emptyText: { fontStyle: "italic", textAlign: "center", paddingHorizontal: spacing[4] },
  shelfGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  shelfCard: { width: "47.5%", gap: 2 },
  newShelf: {
    height: 104,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bold: { fontWeight: "700" },
  group: { gap: spacing[2], paddingTop: spacing[3] },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  statusCell: {
    width: "48.5%",
    flexGrow: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
