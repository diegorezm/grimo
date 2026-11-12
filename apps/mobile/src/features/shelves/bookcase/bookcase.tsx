import {
  type BookcasePiece,
  coverUrl,
  layoutBookcase,
  type ShelfStyle,
  type SpineFinish,
} from "@grimo/core";
import { Image } from "expo-image";
import { type ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
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
  spineColor,
  spineInk,
} from "./look";

/** What a book on the bookcase needs: your own shelf rows and a profile's shelf both fit. */
export interface ShelfBookItem {
  entry: { id: string };
  book: {
    title: string;
    coverUrl: string | null;
    openLibraryId: string;
    pageCount?: number | null;
  };
}

interface Props<T extends ShelfBookItem> {
  items: readonly T[];
  style: ShelfStyle;
  /** Screen width (the bookcase goes edge to edge). */
  width: number;
  /** At least this tall (the screen), so the furniture always reaches the bottom. */
  minHeight: number;
  /** Room above the first shelf for the floating header. */
  top: number;
  /** Room under the last shelf for the tab bar. */
  bottom: number;
  /** On the brass plaque at the foot of the furniture. */
  name: string;
  selecting?: boolean;
  selected?: readonly string[];
  onPress: (item: T) => void;
  onLongPress?: (item: T) => void;
  /** Books land on their shelves (first visit, or the arrangement just changed). */
  animate?: boolean;
  /** Shown on an empty second shelf (no books yet). */
  empty?: ReactNode;
}

/**
 * A reader's shelf as a piece of furniture: the model (classic, floating, arch, nichos,
 * library), painted in the chosen material, books laid out by `layoutBookcase` (`@grimo/core`,
 * the same on the web) with their spines, piles or covers, the objects between them and the
 * light over it all. It fills the screen; the page around it scrolls.
 */
export function Bookcase<T extends ShelfBookItem>(props: Props<T>) {
  const { items, style, width, minHeight, top, bottom, name, empty } = props;
  const material = materialOf(style);
  const look = modelLook(style, width, top);
  const layout = useMemo(
    () =>
      layoutBookcase(
        items.map((item) => ({
          key: item.entry.id,
          title: item.book.title,
          pageCount: item.book.pageCount,
          item,
        })),
        style,
        width,
      ),
    [items, style, width],
  );
  const { geometry, rowHeight } = layout;
  let order = 0;

  return (
    <View style={[{ minHeight }, look.frame]}>
      <View style={look.crown}>
        {style.model === "library" && (
          <View style={[styles.lamp, { left: (width - 120) / 2 }]}>
            <LibraryLamp />
          </View>
        )}
      </View>
      <View style={[styles.grow, look.inner]}>
        {style.model === "arch" && (
          <View style={styles.ivy} pointerEvents="none">
            <ArchIvy width={width - geometry.side * 2} />
          </View>
        )}
        {layout.rows.map((row, r) => (
          <View key={r} style={[styles.row, { gap: geometry.gap }]}>
            {row.map((cell, c) => (
              <View key={c} style={[styles.grow, look.cell]}>
                <View
                  style={[styles.books, { height: rowHeight }, look.row, look.rowLight ?? null]}
                >
                  {cell.map((piece) => (
                    <Piece
                      key={piece.key}
                      piece={piece}
                      order={order++}
                      material={material}
                      finish={style.finish}
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
      </View>
      <View style={[styles.foot, { height: bottom + 70 }]}>
        <View style={styles.plaque}>
          <Text style={styles.plaqueText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
      {look.light && <View pointerEvents="none" style={[StyleSheet.absoluteFill, look.light]} />}
    </View>
  );
}

type Row<T> = { key: string; title: string; pageCount?: number | null; item: T };

function Piece<T extends ShelfBookItem>({
  piece,
  order,
  material,
  finish,
  selecting = false,
  selected = [],
  onPress,
  onLongPress,
  animate = false,
}: Props<T> & {
  piece: BookcasePiece<Row<T>>;
  order: number;
  material: Material;
  finish: SpineFinish;
}) {
  const entering = animate ? landAt(order) : undefined;
  if (piece.kind === "decor") {
    return (
      <Animated.View entering={entering} style={styles.object}>
        <DecorPiece decor={piece.decor} />
      </Animated.View>
    );
  }
  const touch = (item: T) => ({
    selecting,
    picked: selected.includes(item.entry.id),
    onPress: () => onPress(item),
    onLongPress: onLongPress && (() => onLongPress(item)),
  });
  if (piece.kind === "stack") {
    return (
      <Animated.View entering={entering} style={styles.stack}>
        {piece.books.map(({ book, length, thickness, tone, shift }) => (
          <Touch key={book.key} label={book.title} {...touch(book.item)}>
            <View
              style={[
                styles.lying,
                {
                  width: length,
                  height: thickness,
                  backgroundColor: spineColor(material, tone, finish === "cover" ? "tone" : finish),
                  transform: [{ translateX: shift }],
                },
              ]}
            >
              <View style={[StyleSheet.absoluteFill, styles.lyingGloss]} />
              {finish === "linen" && <View style={[StyleSheet.absoluteFill, LINEN]} />}
              <Text
                numberOfLines={1}
                style={[
                  styles.lyingTitle,
                  { color: spineInk(material, tone, finish === "cover" ? "tone" : finish) },
                ]}
              >
                {book.title}
              </Text>
            </View>
          </Touch>
        ))}
      </Animated.View>
    );
  }
  const { book } = piece;
  if (piece.kind === "cover") {
    return (
      <Animated.View entering={entering} style={styles.coverSlot}>
        <Touch label={book.title} {...touch(book.item)}>
          <View
            style={[
              styles.cover,
              {
                width: piece.width,
                height: piece.height,
                backgroundColor: spineColor(material, piece.tone, finish),
              },
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
              <Text
                numberOfLines={4}
                style={[styles.coverTitle, { color: spineInk(material, piece.tone, finish) }]}
              >
                {book.title}
              </Text>
            )}
            <View style={[StyleSheet.absoluteFill, styles.coverEdge]} />
          </View>
        </Touch>
      </Animated.View>
    );
  }
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
      <Touch label={book.title} {...touch(book.item)}>
        <Spine
          title={book.title}
          cover={book.item.book.coverUrl}
          width={piece.width}
          height={piece.height}
          tone={piece.tone}
          material={material}
          finish={finish}
        />
      </Touch>
    </Animated.View>
  );
}

/** One spine: the cover's edge ("Capa do livro"), or the shelf's tone, linen or leather. */
export function Spine({
  title,
  cover,
  width,
  height,
  tone,
  material,
  finish,
}: {
  title: string;
  cover: string | null;
  width: number;
  height: number;
  tone: number;
  material: Material;
  finish: SpineFinish;
}) {
  const ownColor = finish !== "cover" || !cover;
  const paint: SpineFinish = finish === "cover" ? "tone" : finish;
  return (
    <View
      style={[styles.spine, { width, height, backgroundColor: spineColor(material, tone, paint) }]}
    >
      {!ownColor && cover && (
        <Image
          source={coverUrl(cover, "M")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="left"
          accessibilityIgnoresInvertColors
        />
      )}
      {finish === "linen" && <View style={[StyleSheet.absoluteFill, LINEN]} />}
      {finish === "leather" && <GoldBands />}
      <View style={[StyleSheet.absoluteFill, SPINE_GLOSS]} />
      {ownColor && (
        <View
          style={[
            styles.vertical,
            { width: height, height: width, left: (width - height) / 2, top: (height - width) / 2 },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.spineTitle,
              { color: spineInk(material, tone, paint), fontSize: width < 27 ? 10 : 11.5 },
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
  books: { flexDirection: "row", alignItems: "flex-end" },
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
  band: { position: "absolute", left: 0, right: 0, backgroundColor: shelfBrass.base },
  vertical: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    transform: [{ rotate: "-90deg" }],
  },
  spineTitle: { fontFamily: Fonts.serif },
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
