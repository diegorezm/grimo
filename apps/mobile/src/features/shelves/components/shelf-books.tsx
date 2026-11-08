import { coverUrl, type ShelfView, spineLook } from "@grimo/core";
import { Image } from "expo-image";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/components/ui";
import { radius, spacing } from "@/constants/theme";
import { BookCover } from "@/features/books";
import { useTheme } from "@/hooks/use-theme";

/** What a book on the shelf needs: your own shelf rows and a profile's shelf both fit. */
export interface ShelfBookItem {
  entry: { id: string };
  book: {
    title: string;
    coverUrl: string | null;
    openLibraryId: string;
    pageCount?: number | null;
  };
}
type ShelfItem = ShelfBookItem;

/** Covers per shelf in the "Capas" view. */
const PER_SHELF = 3;
const GAP = 3;
/** Spines are drawn at this share of the look's size (`spineLook` is in web pixels). */
const SPINE_SCALE = { width: 0.55, height: 0.5 };

interface Props {
  items: ShelfItem[];
  view: ShelfView;
  selecting: boolean;
  selected: string[];
  onPress: (item: ShelfItem) => void;
  /** Holding a book (starts select mode). */
  onLongPress?: (item: ShelfItem) => void;
}

/**
 * The books of a shelf as a real shelf: covers standing on planks ("Capas"), or spines side by
 * side, wider for longer books ("Lombadas"). Both work in select mode.
 */
export function ShelfBooks(props: Props) {
  const { width } = useWindowDimensions();
  // The screen's side padding and the shelf's own.
  const inner = width - spacing[4] * 2 - spacing[2] * 2;
  return props.view === "grid" ? (
    <CoverShelves {...props} inner={inner} />
  ) : (
    <SpineShelves {...props} inner={inner} />
  );
}

function Plank({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View>
      <View style={styles.books}>{children}</View>
      <View style={[styles.plank, { backgroundColor: theme.edge }]} />
    </View>
  );
}

function CoverShelves({
  items,
  selecting,
  selected,
  onPress,
  onLongPress,
  inner,
}: Props & { inner: number }) {
  const cover = Math.floor((inner - spacing[3] * (PER_SHELF - 1)) / PER_SHELF);
  const rows: ShelfItem[][] = [];
  for (let i = 0; i < items.length; i += PER_SHELF) rows.push(items.slice(i, i + PER_SHELF));
  return (
    <View style={styles.shelves}>
      {rows.map((row) => (
        <Plank key={row[0]!.entry.id}>
          <View style={[styles.row, { gap: spacing[3] }]}>
            {row.map((item) => (
              <Book
                key={item.entry.id}
                item={item}
                {...{ selecting, selected, onPress, onLongPress }}
              >
                <BookCover src={item.book.coverUrl} title={item.book.title} width={cover} />
              </Book>
            ))}
          </View>
        </Plank>
      ))}
    </View>
  );
}

function SpineShelves({
  items,
  selecting,
  selected,
  onPress,
  onLongPress,
  inner,
}: Props & { inner: number }) {
  const theme = useTheme();
  const tones = [
    { bg: theme.surfaceMuted, fg: theme.text },
    { bg: theme.accent, fg: theme.accentForeground },
    { bg: theme.inverse, fg: theme.inverseForeground },
    { bg: theme.surface, fg: theme.text },
  ];
  // Fill each shelf with spines until the next one doesn't fit.
  const rows: { item: ShelfItem; w: number; h: number; variant: number }[][] = [[]];
  let used = 0;
  for (const item of items) {
    const look = spineLook(item.book.title, item.book.pageCount);
    const w = Math.round(look.width * SPINE_SCALE.width);
    const h = Math.round(look.height * SPINE_SCALE.height);
    if (used + w > inner && rows[rows.length - 1]!.length > 0) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1]!.push({ item, w, h, variant: look.variant });
    used += w + GAP;
  }
  return (
    <View style={styles.shelves}>
      {rows.map((row) => (
        <Plank key={row[0]!.item.entry.id}>
          <View style={[styles.row, { gap: GAP }]}>
            {row.map(({ item, w, h, variant }) => {
              const tone = tones[variant % tones.length]!;
              return (
                <Book
                  key={item.entry.id}
                  item={item}
                  {...{ selecting, selected, onPress, onLongPress }}
                >
                  <View
                    style={[
                      styles.spine,
                      { width: w, height: h, backgroundColor: tone.bg, borderColor: theme.border },
                    ]}
                  >
                    {item.book.coverUrl ? (
                      <Image
                        source={coverUrl(item.book.coverUrl, "M")}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        contentPosition="left"
                        accessibilityIgnoresInvertColors
                      />
                    ) : null}
                    {!item.book.coverUrl && (
                      <View
                        style={[
                          styles.vertical,
                          { width: h, height: w, left: (w - h) / 2, top: (h - w) / 2 },
                        ]}
                      >
                        <Text numberOfLines={1} style={[styles.spineTitle, { color: tone.fg }]}>
                          {item.book.title}
                        </Text>
                      </View>
                    )}
                  </View>
                </Book>
              );
            })}
          </View>
        </Plank>
      ))}
    </View>
  );
}

/** One book on the shelf: opens it, or is picked in select mode. */
function Book({
  item,
  selecting,
  selected,
  onPress,
  onLongPress,
  children,
}: {
  item: ShelfItem;
  selecting: boolean;
  selected: string[];
  onPress: (item: ShelfItem) => void;
  onLongPress?: (item: ShelfItem) => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const picked = selected.includes(item.entry.id);
  return (
    <Pressable
      accessibilityRole={selecting ? "checkbox" : "button"}
      accessibilityState={selecting ? { checked: picked } : undefined}
      accessibilityLabel={item.book.title}
      onPress={() => onPress(item)}
      onLongPress={onLongPress && (() => onLongPress(item))}
      delayLongPress={350}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
            <Text variant="label" color="accentForeground">
              ✓
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shelves: { gap: spacing[5] },
  books: { paddingHorizontal: spacing[2] },
  row: { flexDirection: "row", alignItems: "flex-end" },
  plank: { height: 8, borderRadius: 2 },
  spine: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  vertical: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-90deg" }],
    paddingHorizontal: spacing[2],
  },
  spineTitle: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
