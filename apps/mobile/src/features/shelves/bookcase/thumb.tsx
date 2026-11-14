import { type ShelfStyle, spineSize } from "@grimo/core";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { premium } from "@/lib/premium";
import { darken, materialOf, spineColor } from "./look";

/**
 * A small drawing of a shelf style (ready styles, models, the shelves list): the room, the
 * furniture's shape in its material and a few spines in their colors.
 */
export function BookcaseThumb({
  style,
  titles,
  height = 96,
  ring,
}: {
  style: ShelfStyle;
  /** Some of the shelf's books, for the spines (any titles do). */
  titles: readonly string[];
  height?: number;
  /** Border color when this is the chosen one. */
  ring?: string;
}) {
  const m = materialOf(style);
  const cubbies = style.model === "cubbies";
  const cells = cubbies ? 4 : 3;
  const shelf = Math.round((height - 16) / (cubbies ? 2 : 3)) - 4;
  const paid = premium.models[style.model];
  const edge = m.trim ?? m.plank;
  const frame: ViewStyle = paid
    ? paid.thumb(m)
    : style.model === "floating"
      ? { paddingTop: 6 }
      : style.model === "arch"
        ? {
            backgroundColor: m.side,
            paddingTop: 18,
            paddingHorizontal: 5,
            borderTopLeftRadius: 999,
            borderTopRightRadius: 999,
          }
        : style.model === "library"
          ? {
              backgroundColor: m.side,
              paddingTop: 10,
              paddingHorizontal: 7,
              borderTopWidth: 4,
              borderTopColor: darken(m.side, 0.2),
            }
          : { backgroundColor: m.side, paddingTop: 8, paddingHorizontal: 5 };
  const books = titles.length > 0 ? titles : ["A", "B", "C", "D", "E"];
  return (
    <View
      style={[
        styles.room,
        { height, backgroundColor: m.room },
        ring ? { borderColor: ring, borderWidth: 2 } : null,
      ]}
    >
      <View style={[styles.frame, frame, cubbies && styles.grid]}>
        {Array.from({ length: cells }, (_, cell) => (
          <View
            key={cell}
            style={[
              styles.cell,
              { height: shelf },
              cubbies && styles.half,
              style.model === "floating"
                ? { borderBottomWidth: 3, borderBottomColor: edge, marginBottom: 6 }
                : {
                    backgroundColor: m.back,
                    borderBottomWidth: cubbies ? 0 : 3,
                    borderBottomColor: edge,
                  },
            ]}
          >
            {Array.from({ length: cubbies ? 3 : 5 }, (_, i) => {
              const title = books[(cell * 5 + i) % books.length]!;
              const size = spineSize(title, null);
              const cover = style.layout === "covers";
              return (
                <View
                  key={i}
                  style={{
                    width: cover ? 9 : Math.max(4, Math.round(size.width / 6)),
                    height: cover ? 13 : Math.min(shelf - 3, Math.round(size.height / 9)),
                    backgroundColor: spineColor(
                      m,
                      size.tone,
                      style.finish === "cover" ? "tone" : style.finish,
                    ),
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  frame: { width: "66%", gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { flexDirection: "row", alignItems: "flex-end", gap: 1, paddingHorizontal: 3 },
  half: { width: "47%" },
});
