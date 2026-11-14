import { type ShelfStyle, spineSize } from "@grimo/core";
import type { CSSProperties } from "react";
import { premium } from "@/lib/premium";
import { cn } from "@/utils/cn";
import { darken, materialOf, spineColor } from "./look";

/**
 * A small drawing of a shelf style (ready styles, models, the shelves list): the room, the
 * furniture's shape in its material and a few spines in their colors.
 */
export function BookcaseThumb({
  style,
  titles,
  height = 96,
  ring = false,
}: {
  style: ShelfStyle;
  /** Some of the shelf's books, for the spines (any titles do). */
  titles: readonly string[];
  height?: number;
  /** Ringed in the accent: the chosen one. */
  ring?: boolean;
}) {
  const m = materialOf(style);
  const cubbies = style.model === "cubbies";
  const cells = cubbies ? 4 : 3;
  const shelf = Math.round((height - 16) / (cubbies ? 2 : 3)) - 4;
  const paid = premium.models[style.model];
  const edge = m.trim ?? m.plank;
  const frame: CSSProperties = paid
    ? paid.thumb(m)
    : style.model === "floating"
      ? { paddingTop: 6 }
      : style.model === "arch"
        ? { background: m.side, padding: "18px 5px 0", borderRadius: "999px 999px 0 0" }
        : style.model === "library"
          ? {
              background: m.side,
              padding: "10px 7px 0",
              borderTop: `4px solid ${darken(m.side, 0.2)}`,
            }
          : { background: m.side, padding: "8px 5px 0" };
  const books = titles.length > 0 ? titles : ["A", "B", "C", "D", "E"];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-end justify-center overflow-hidden rounded-[14px] outline-2 -outline-offset-2",
        ring ? "outline-accent" : "outline-transparent",
      )}
      style={{ height, background: m.room }}
    >
      <div className={cn("flex w-2/3 gap-1", cubbies ? "flex-wrap" : "flex-col")} style={frame}>
        {Array.from({ length: cells }, (_, cell) => (
          <div
            key={cell}
            className={cn("flex items-end gap-px px-[3px]", cubbies && "w-[47%]")}
            style={{
              height: shelf,
              ...(style.model === "floating"
                ? { borderBottom: `3px solid ${edge}`, marginBottom: 6 }
                : { background: m.back, borderBottom: cubbies ? 0 : `3px solid ${edge}` }),
            }}
          >
            {Array.from({ length: cubbies ? 3 : 5 }, (_, i) => {
              const title = books[(cell * 5 + i) % books.length]!;
              const size = spineSize(title, null);
              const cover = style.layout === "covers";
              return (
                <span
                  key={i}
                  className="rounded-[1px]"
                  style={{
                    width: cover ? 9 : Math.max(4, Math.round(size.width / 6)),
                    height: cover ? 13 : Math.min(shelf - 3, Math.round(size.height / 9)),
                    background: spineColor(
                      m,
                      size.tone,
                      style.finish === "cover" ? "tone" : style.finish,
                    ),
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
