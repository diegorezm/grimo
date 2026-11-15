import {
  type BookcasePiece,
  coverUrl,
  type DecorLevels,
  isJustRead,
  layoutBookcase,
  readingProgress,
  type ShelfStyle,
  type SpineColors,
  type SpineFinish,
  type SpineLettering,
  spineLettering,
} from "@grimo/core";
import { Image } from "expo-image";
import { type ComponentRef, type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type DerivedValue,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Text } from "@/components/ui";
import { Fonts, shelfBrass } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { landAt } from "@/lib/motion";
import { ArchIvy, Bracket, DecorPiece, LibraryLadder, LibraryLamp } from "./decor";
import {
  darken,
  LINEN,
  type Material,
  materialOf,
  modelLook,
  SPINE_GLOSS,
  type SpinePaint,
  spinePaint,
} from "./look";

/** What a book on the bookcase needs: your own shelf rows and a profile's shelf both fit. */
export interface ShelfBookItem {
  entry: {
    id: string;
    /** With these, a book being read shows its ribbon and one just read shines. */
    status?: string;
    currentPage?: number;
    finishedAt?: number | null;
  };
  book: {
    title: string;
    coverUrl: string | null;
    openLibraryId: string;
    pageCount?: number | null;
  };
  /** The spine in its cover's colors, once the backend read them. */
  spine?: SpineColors | null;
}

interface Props<T extends ShelfBookItem> {
  items: readonly T[];
  style: ShelfStyle;
  /** Width of the bookcase. */
  width: number;
  /** At least this tall (the screen), so the furniture always reaches the bottom. */
  minHeight: number;
  /** Room above the first shelf for the floating header. */
  top: number;
  /** Room under the last shelf for the tab bar. */
  bottom: number;
  /** On the brass plaque at the foot of the furniture. */
  name: string;
  /** The reader's own order (entry ids), for "Do meu jeito". */
  order?: readonly string[];
  /** What the reader's objects have earned (the lit candle, the grown plant…). */
  decorLevels?: DecorLevels;
  /** How the phone is tilted (-1..1): the shelves shift a little inside the frame. */
  tilt?: SharedValue<number> | DerivedValue<number>;
  selecting?: boolean;
  selected?: readonly string[];
  /** "Arrumar com a mão": holding a book lifts it, dropping puts it before the book under it. */
  arranging?: boolean;
  onMove?: (key: string, before: string | null) => void;
  /** A book is in the air (the page stops scrolling meanwhile). */
  onDragging?: (dragging: boolean) => void;
  onPress: (item: T) => void;
  onLongPress?: (item: T) => void;
  /** Books land on their shelves (first visit, or the arrangement just changed). */
  animate?: boolean;
  /** Shown on an empty second shelf (no books yet). */
  empty?: ReactNode;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A mounted `View` (what a ref to one holds). */
type ViewRef = ComponentRef<typeof View>;

const measure = (view: ViewRef) =>
  new Promise<Rect>((resolve) => view.measureInWindow((x, y, w, h) => resolve({ x, y, w, h })));

/** What a book needs to be dragged: where the finger is, and what to do at each end. */
interface Drag<T> {
  x: SharedValue<number>;
  y: SharedValue<number>;
  begin: (item: T) => void;
  drop: (key: string, x: number, y: number) => void;
  cancel: () => void;
  register: (key: string, view: ViewRef | null) => void;
}

const GHOST = { width: 70, height: 104 };

/**
 * A reader's shelf as a piece of furniture: the model (classic, floating, arch, nichos,
 * library), painted in the chosen material, books laid out by `layoutBookcase` (`@grimo/core`,
 * the same on the web) with their spines in the colors of their covers, piles or covers, the
 * objects between them and the light over it all. The book being read has its ribbon out, one
 * just read shines. It fills the screen; the page around it scrolls.
 */
export function Bookcase<T extends ShelfBookItem>(props: Props<T>) {
  const { items, style, width, minHeight, top, bottom, name, empty, order, tilt } = props;
  const { arranging = false, onMove, onDragging } = props;
  const theme = useTheme();
  const material = materialOf(style);
  const look = modelLook(style, width, top);
  const layout = useMemo(
    () =>
      layoutBookcase(
        items.map((item) => ({
          key: item.entry.id,
          title: item.book.title,
          pageCount: item.book.pageCount,
          color: item.spine?.base,
          item,
        })),
        style,
        width,
        4,
        order,
      ),
    [items, style, width, order],
  );
  const { geometry, rowHeight } = layout;
  // Each row's books, left to right: where a dropped book lands.
  const rowKeys = useMemo(
    () =>
      layout.rows.map((row) =>
        row
          .flat()
          .flatMap((piece) =>
            piece.kind === "stack"
              ? piece.books.map(({ book }) => book.key)
              : piece.kind === "decor"
                ? []
                : [piece.key],
          ),
      ),
    [layout],
  );

  const root = useRef<ViewRef>(null);
  const rowViews = useRef<(ViewRef | null)[]>([]);
  const slots = useRef(new Map<string, ViewRef>());
  const [lifted, setLifted] = useState<T | null>(null);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  // The latest of what a drag needs, so the gestures stay the same while the screen re-renders.
  const latest = useRef({ rowKeys, onMove, onDragging });
  latest.current = { rowKeys, onMove, onDragging };

  const begin = useCallback(
    (item: T) => {
      latest.current.onDragging?.(true);
      // The floating cover shows once we know where the bookcase is on the screen.
      root.current?.measureInWindow((x, y) => {
        originX.value = x;
        originY.value = y;
        setLifted(item);
      });
    },
    [originX, originY],
  );
  const cancel = useCallback(() => {
    setLifted(null);
    latest.current.onDragging?.(false);
  }, []);
  const drop = useCallback(async (key: string, x: number, y: number) => {
    const { rowKeys, onMove } = latest.current;
    const rects = await Promise.all(
      rowKeys.map((_, r) => {
        const view = rowViews.current[r];
        return view ? measure(view) : null;
      }),
    );
    // The shelf under the finger (or the nearest one).
    let target = -1;
    let nearest = Number.POSITIVE_INFINITY;
    rects.forEach((rect, r) => {
      if (!rect) return;
      const away = y < rect.y ? rect.y - y : y > rect.y + rect.h ? y - rect.y - rect.h : 0;
      if (away < nearest) {
        nearest = away;
        target = r;
      }
    });
    if (target < 0) return;
    const placed = await Promise.all(
      rowKeys[target]!.map(async (id) => {
        const view = slots.current.get(id);
        return view ? { id, rect: await measure(view) } : null;
      }),
    );
    // Before the first book to the right of the finger; else before the next shelf's first.
    let before =
      placed.find((slot) => slot && slot.id !== key && slot.rect.x + slot.rect.w / 2 > x)?.id ??
      null;
    for (let r = target + 1; r < rowKeys.length && before === null; r++) {
      before = rowKeys[r]!.find((id) => id !== key) ?? null;
    }
    onMove?.(key, before);
  }, []);
  const register = useCallback((key: string, view: ViewRef | null) => {
    if (view) slots.current.set(key, view);
    else slots.current.delete(key);
  }, []);
  const drag = useMemo<Drag<T> | null>(
    () => (arranging ? { x: fingerX, y: fingerY, begin, drop, cancel, register } : null),
    [arranging, fingerX, fingerY, begin, drop, cancel, register],
  );

  const shift = useAnimatedStyle(() => ({
    transform: [{ translateX: (tilt?.value ?? 0) * 4 }],
  }));
  const ghost = useAnimatedStyle(() => ({
    left: fingerX.value - originX.value - GHOST.width / 2,
    top: fingerY.value - originY.value - GHOST.height * 0.7,
  }));
  let index = 0;

  return (
    <View ref={root} collapsable={false} style={[{ minHeight }, look.frame]}>
      <View style={look.crown}>
        {style.model === "library" && (
          <View style={[styles.lamp, { left: (width - 120) / 2 }]}>
            <LibraryLamp />
          </View>
        )}
      </View>
      <Animated.View style={[styles.grow, look.inner, shift]}>
        {style.model === "arch" && (
          <View style={styles.ivy} pointerEvents="none">
            <ArchIvy width={width - geometry.side * 2} />
          </View>
        )}
        {layout.rows.map((row, r) => (
          <View
            key={r}
            ref={(view) => {
              rowViews.current[r] = view;
            }}
            collapsable={false}
            style={[styles.row, { gap: geometry.gap }]}
          >
            {row.map((cell, c) => (
              <View key={c} style={[styles.grow, look.cell]}>
                <View
                  style={[styles.books, { height: rowHeight }, look.row, look.rowLight ?? null]}
                >
                  {cell.map((piece) => (
                    <Piece
                      key={piece.key}
                      piece={piece}
                      index={index++}
                      material={material}
                      finish={style.finish}
                      drag={drag}
                      liftedId={lifted?.entry.id ?? null}
                      {...props}
                    />
                  ))}
                  {empty && r === 1 && c === 0 && cell.length === 0 && (
                    <View style={styles.empty}>{empty}</View>
                  )}
                </View>
                <View style={look.plankTop} />
                <View style={look.plank} />
                {style.model === "floating" && (
                  <>
                    <View style={[styles.bracket, { left: 44 }]}>
                      <Bracket color={darken(material.plank, 0.35)} />
                    </View>
                    <View style={[styles.bracket, { right: 44 }]}>
                      <Bracket color={darken(material.plank, 0.35)} flip />
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
        {style.model === "library" && (
          <View style={styles.ladder} pointerEvents="none">
            <LibraryLadder height={Math.min(560, (rowHeight + 22) * 3)} />
          </View>
        )}
      </Animated.View>
      <View style={[styles.foot, { height: bottom + 70 }]}>
        <View style={styles.plaque}>
          <Text style={styles.plaqueText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
      {look.sides && (
        <>
          <View
            pointerEvents="none"
            style={[styles.side, { left: 0, width: look.sides.width }, look.sides.left]}
          />
          <View
            pointerEvents="none"
            style={[styles.side, { right: 0, width: look.sides.width }, look.sides.right]}
          />
        </>
      )}
      {look.light && <View pointerEvents="none" style={[StyleSheet.absoluteFill, look.light]} />}
      {lifted && (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { backgroundColor: lifted.spine?.base ?? theme.accent }, ghost]}
        >
          {lifted.book.coverUrl ? (
            <Image
              source={coverUrl(lifted.book.coverUrl, "M")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text
              numberOfLines={4}
              style={[styles.coverTitle, { color: lifted.spine?.ink ?? theme.accentForeground }]}
            >
              {lifted.book.title}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

type Row<T> = {
  key: string;
  title: string;
  pageCount?: number | null;
  color?: string | null;
  item: T;
};

function Piece<T extends ShelfBookItem>({
  piece,
  index,
  material,
  finish,
  drag,
  liftedId,
  decorLevels,
  selecting = false,
  selected = [],
  arranging = false,
  onPress,
  onLongPress,
  animate = false,
}: Props<T> & {
  piece: BookcasePiece<Row<T>>;
  index: number;
  material: Material;
  finish: SpineFinish;
  drag: Drag<T> | null;
  liftedId: string | null;
}) {
  const theme = useTheme();
  const entering = animate ? landAt(index) : undefined;
  if (piece.kind === "decor") {
    return (
      <Animated.View entering={entering} style={styles.object}>
        <DecorPiece decor={piece.decor} level={decorLevels?.[piece.decor] ?? 0} />
      </Animated.View>
    );
  }
  const touch = (item: T) => ({
    selecting,
    picked: selected.includes(item.entry.id),
    // While arranging, a book is only held and dragged.
    onPress: arranging ? () => {} : () => onPress(item),
    onLongPress: arranging || !onLongPress ? undefined : () => onLongPress(item),
  });
  const paintOf = (item: T, tone: number) => spinePaint(material, tone, finish, item.spine);
  const held = (item: T) => (liftedId === item.entry.id ? styles.held : null);

  if (piece.kind === "stack") {
    return (
      <Animated.View entering={entering} style={styles.stack}>
        {piece.books.map(({ book, length, thickness, tone, shift }) => {
          const paint = paintOf(book.item, tone);
          return (
            <Draggable key={book.key} item={book.item} drag={drag} style={held(book.item)}>
              <Touch label={book.title} {...touch(book.item)}>
                <View
                  style={[
                    styles.lying,
                    {
                      width: length,
                      height: thickness,
                      backgroundColor: paint.base,
                      transform: [{ translateX: shift }],
                    },
                    paint.band ? { borderLeftWidth: 6, borderLeftColor: paint.band } : null,
                  ]}
                >
                  <View style={[StyleSheet.absoluteFill, styles.lyingGloss]} />
                  {finish === "linen" && <View style={[StyleSheet.absoluteFill, LINEN]} />}
                  <Text numberOfLines={1} style={[styles.lyingTitle, { color: paint.ink }]}>
                    {book.title}
                  </Text>
                </View>
              </Touch>
            </Draggable>
          );
        })}
      </Animated.View>
    );
  }

  const { book } = piece;
  const paint = paintOf(book.item, piece.tone);
  if (piece.kind === "cover") {
    return (
      <Animated.View entering={entering} style={styles.coverSlot}>
        <Draggable item={book.item} drag={drag} style={held(book.item)}>
          <Touch label={book.title} {...touch(book.item)}>
            <View
              style={[
                styles.cover,
                { width: piece.width, height: piece.height, backgroundColor: paint.base },
              ]}
            >
              {book.item.book.coverUrl ? (
                <Image
                  source={coverUrl(book.item.book.coverUrl, "M")}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Text numberOfLines={4} style={[styles.coverTitle, { color: paint.ink }]}>
                  {book.title}
                </Text>
              )}
              <View style={[StyleSheet.absoluteFill, styles.coverEdge]} />
            </View>
          </Touch>
        </Draggable>
      </Animated.View>
    );
  }

  const { entry } = book.item;
  const reading = entry.status === "reading";
  const justRead = entry.status === "read" && isJustRead(entry.finishedAt, Date.now());
  return (
    <Animated.View
      entering={entering}
      style={[
        styles.spineSlot,
        piece.lean && {
          marginLeft: 10,
          transform: [{ rotate: "-9deg" }],
          transformOrigin: "left bottom",
        },
      ]}
    >
      <Draggable item={book.item} drag={drag} style={held(book.item)}>
        <Touch label={reading ? `${book.title}, lendo` : book.title} {...touch(book.item)}>
          <View
            style={
              justRead && {
                boxShadow: `0 0 0 1.5px ${theme.gold}, 0 0 14px 2px ${theme.gold}99`,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }
            }
          >
            <Spine
              title={book.title}
              width={piece.width}
              height={piece.height}
              paint={paint}
              finish={finish}
              lettering={spineLettering(book.title)}
              // Until the cover's colors are read, "Capa do livro" shows the cover's edge.
              coverEdge={finish === "cover" && !book.item.spine ? book.item.book.coverUrl : null}
            />
          </View>
        </Touch>
        {justRead && (
          <Svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            style={[styles.sparkle, { left: piece.width / 2 - 7 }]}
          >
            <Path d="M7 0l1.6 5.4L14 7l-5.4 1.6L7 14l-1.6-5.4L0 7l5.4-1.6z" fill={theme.gold} />
          </Svg>
        )}
        {reading && (
          <Ribbon
            left={piece.width / 2 - 4}
            progress={readingProgress(entry.currentPage ?? 0, book.item.book.pageCount)}
          />
        )}
      </Draggable>
    </Animated.View>
  );
}

/** The ribbon of the book being read, hanging over the shelf: longer the further you are. */
function Ribbon({ left, progress }: { left: number; progress: number }) {
  const theme = useTheme();
  const length = 12 + Math.round(progress * 26);
  return (
    <Svg
      width={8}
      height={length}
      pointerEvents="none"
      style={[styles.ribbon, { left, bottom: -length }]}
    >
      <Defs>
        <LinearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.accentStart} />
          <Stop offset="1" stopColor={theme.accent} />
        </LinearGradient>
      </Defs>
      <Path d={`M0 0h8v${length}l-4-4-4 4z`} fill="url(#ribbon)" />
    </Svg>
  );
}

/** A book you can hold and drag to another place while arranging; otherwise just the book. */
function Draggable<T extends ShelfBookItem>({
  item,
  drag,
  style,
  children,
}: {
  item: T;
  drag: Drag<T> | null;
  style?: ViewStyle | null;
  children: ReactNode;
}) {
  const id = item.entry.id;
  const gesture = useMemo(() => {
    if (!drag) return null;
    const { x, y, begin, drop, cancel } = drag;
    return Gesture.Pan()
      .activateAfterLongPress(220)
      .onStart((event) => {
        x.value = event.absoluteX;
        y.value = event.absoluteY;
        runOnJS(begin)(item);
      })
      .onUpdate((event) => {
        x.value = event.absoluteX;
        y.value = event.absoluteY;
      })
      .onEnd((event) => {
        runOnJS(drop)(id, event.absoluteX, event.absoluteY);
      })
      .onFinalize(() => {
        runOnJS(cancel)();
      });
  }, [drag, item, id]);
  if (!drag || !gesture) return <View style={style}>{children}</View>;
  return (
    <GestureDetector gesture={gesture}>
      <View ref={(view) => drag.register(id, view)} collapsable={false} style={style}>
        {children}
      </View>
    </GestureDetector>
  );
}

/**
 * One spine, painted: in the colors of its cover (a band at the head, the title in the book's
 * own lettering), or in the shelf's tone, linen or leather.
 */
export function Spine({
  title,
  width,
  height,
  paint,
  finish,
  lettering = "serif",
  coverEdge = null,
}: {
  title: string;
  width: number;
  height: number;
  paint: SpinePaint;
  finish: SpineFinish;
  lettering?: SpineLettering;
  /** A cover to show the edge of instead of a painted spine. */
  coverEdge?: string | null;
}) {
  const size = width < 27 ? 10 : 11.5;
  return (
    <View style={[styles.spine, { width, height, backgroundColor: paint.base }]}>
      {coverEdge && (
        <Image
          source={coverUrl(coverEdge, "M")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="left"
          accessibilityIgnoresInvertColors
        />
      )}
      {finish === "linen" && <View style={[StyleSheet.absoluteFill, LINEN]} />}
      {finish === "leather" && <GoldBands />}
      {paint.band && !coverEdge && (
        <>
          <View style={[styles.headBand, { backgroundColor: paint.band }]} />
          <View style={[styles.mark, { left: width / 2 - 3.5, borderColor: paint.ink }]} />
        </>
      )}
      <View style={[StyleSheet.absoluteFill, SPINE_GLOSS]} />
      {!coverEdge && (
        <View
          style={[
            styles.vertical,
            { width: height, height: width, left: (width - height) / 2, top: (height - width) / 2 },
            paint.band ? styles.verticalBanded : null,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              { color: paint.ink, fontSize: size, fontFamily: Fonts.serif },
              lettering === "mono" && { fontFamily: Fonts.monoBold, fontSize: size - 1.5 },
              lettering === "caps" && styles.caps,
              lettering === "caps" && { fontSize: size - 1.5 },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Two gilt lines at the head and foot of a leather spine. */
function GoldBands() {
  const band = (style: ViewStyle) => <View style={[styles.band, style]} />;
  return (
    <>
      {band({ top: 10, height: 2 })}
      {band({ top: 15, height: 1 })}
      {band({ bottom: 15, height: 1 })}
      {band({ bottom: 10, height: 2 })}
    </>
  );
}

/** A book you can open, or pick in select mode. */
function Touch({
  label,
  selecting,
  picked,
  onPress,
  onLongPress,
  children,
}: {
  label: string;
  selecting: boolean;
  picked: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={selecting ? "checkbox" : "button"}
      accessibilityState={selecting ? { checked: picked } : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : selecting && !picked ? 0.75 : 1,
        transform: [{ translateY: picked ? -10 : 0 }],
      })}
    >
      {children}
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
            <Text variant="small" color="accentForeground" style={styles.checkMark}>
              ✓
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row" },
  // Above the plank under it, so a ribbon can hang over the shelf.
  books: { flexDirection: "row", alignItems: "flex-end", zIndex: 2 },
  empty: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bracket: { position: "absolute", bottom: -14 },
  lamp: { position: "absolute", bottom: -22, zIndex: 3 },
  ivy: { position: "absolute", top: 18, left: 0, right: 0 },
  ladder: {
    position: "absolute",
    right: -14,
    top: 10,
    zIndex: 2,
    transform: [{ rotate: "5deg" }],
    transformOrigin: "top",
  },
  side: { position: "absolute", top: 0, bottom: 0 },
  foot: { alignItems: "center", paddingTop: 14 },
  plaque: {
    height: 20,
    maxWidth: 240,
    paddingHorizontal: 12,
    borderRadius: 3,
    justifyContent: "center",
    backgroundColor: shelfBrass.base,
    backgroundImage: `linear-gradient(180deg, ${shelfBrass.light} 0%, ${shelfBrass.base} 100%)`,
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
  },
  plaqueText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: shelfBrass.ink,
  },
  object: { marginHorizontal: 6 },
  stack: { marginHorizontal: 6, alignItems: "center" },
  lying: {
    borderRadius: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    boxShadow: "0 1px 0 rgba(0,0,0,0.18)",
  },
  lyingGloss: {
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.22) 100%)",
  },
  lyingTitle: { fontFamily: Fonts.serif, fontSize: 9.5 },
  coverSlot: { marginHorizontal: 4 },
  cover: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
    boxShadow: "0 6px 12px rgba(0,0,0,0.18)",
  },
  coverEdge: { boxShadow: "inset 5px 0 0 rgba(0,0,0,0.14)" },
  coverTitle: { fontFamily: Fonts.serif, fontSize: 12, lineHeight: 13 },
  spineSlot: { marginHorizontal: 1 },
  spine: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    overflow: "hidden",
    boxShadow: "1px 0 0 rgba(0,0,0,0.14)",
  },
  headBand: { position: "absolute", left: 0, right: 0, top: 9, height: 8 },
  mark: {
    position: "absolute",
    bottom: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    opacity: 0.7,
  },
  band: { position: "absolute", left: 0, right: 0, backgroundColor: shelfBrass.base },
  vertical: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    transform: [{ rotate: "-90deg" }],
  },
  // Room for the band at the head and the mark at the foot.
  verticalBanded: { paddingHorizontal: 24 },
  caps: { fontFamily: Fonts.sansHeavy, textTransform: "uppercase", letterSpacing: 0.8 },
  ribbon: { position: "absolute", zIndex: 3 },
  sparkle: { position: "absolute", top: -18 },
  held: { opacity: 0.25 },
  ghost: {
    position: "absolute",
    zIndex: 50,
    width: GHOST.width,
    height: GHOST.height,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
    transform: [{ rotate: "6deg" }],
    boxShadow: "0 22px 30px rgba(0,0,0,0.35)",
  },
  check: {
    position: "absolute",
    top: 4,
    alignSelf: "center",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { fontSize: 11, lineHeight: 13 },
});
