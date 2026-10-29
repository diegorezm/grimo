import { ratingStars } from "@grimo/core";
import { CardFooter, CardSparkle, Delta } from "../parts";
import type { CardProps } from "../types";

/** Spine heights/widths cycle so the shelf looks hand-arranged. */
const SPINES = [
  { h: 620, w: 120 },
  { h: 560, w: 100 },
  { h: 660, w: 130 },
  { h: 590, w: 110 },
  { h: 640, w: 96 },
  { h: 575, w: 124 },
];

/** The month's books as spines on a shelf, numbers below. */
export function EstanteCard({ data, palette, showDeltas }: CardProps) {
  const colors = [palette.accent, palette.accent2, palette.paper, palette.ink, palette.muted];
  const books = data.books.slice(0, 6);
  const placeholders = books.length === 0 ? 3 : 0;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "120px 90px 90px" }}
    >
      <CardSparkle
        size={70}
        color={palette.accent2}
        style={{ position: "absolute", top: 120, right: 100 }}
      />
      <p
        className="font-mono"
        style={{ fontSize: 34, letterSpacing: "0.25em", color: palette.muted }}
      >
        {data.kind === "year" ? "MINHA ESTANTE DE" : "NA ESTANTE EM"}
      </p>
      <h1
        className="font-serif"
        style={{ fontSize: 150, fontStyle: "italic", lineHeight: 1, marginTop: 16 }}
      >
        <span style={{ textTransform: "capitalize" }}>{data.periodName}</span>
      </h1>

      {/* Shelf */}
      <div style={{ marginTop: 110 }}>
        <div className="flex items-end" style={{ gap: 18, height: 680, paddingLeft: 20 }}>
          {books.map((book, i) => {
            const spine = SPINES[i % SPINES.length]!;
            const bg = colors[i % colors.length]!;
            const ink =
              bg === palette.ink ? palette.bg : bg === palette.paper ? palette.ink : palette.bg;
            const last = i === books.length - 1 && books.length > 1;
            return (
              <div
                key={book.title}
                className="flex flex-col items-center justify-between"
                style={{
                  height: spine.h,
                  width: spine.w,
                  background: bg,
                  color: ink,
                  borderRadius: "10px 10px 4px 4px",
                  padding: "28px 0",
                  boxShadow: "inset -10px 0 0 rgba(0,0,0,0.12)",
                  transform: last ? "rotate(9deg)" : undefined,
                  transformOrigin: "bottom left",
                  marginLeft: last ? 30 : 0,
                }}
              >
                <span
                  style={{
                    width: "60%",
                    height: 6,
                    background: ink,
                    opacity: 0.5,
                    borderRadius: 3,
                  }}
                />
                <span
                  className="font-serif"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontSize: 38,
                    fontStyle: "italic",
                    maxHeight: spine.h - 140,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {book.title}
                </span>
                <span
                  style={{
                    width: "60%",
                    height: 6,
                    background: ink,
                    opacity: 0.5,
                    borderRadius: 3,
                  }}
                />
              </div>
            );
          })}
          {Array.from({ length: placeholders }, (_, i) => (
            <div
              key={`empty-${String(i)}`}
              style={{
                height: SPINES[i]!.h,
                width: SPINES[i]!.w,
                border: `5px dashed ${palette.muted}`,
                borderRadius: "10px 10px 4px 4px",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        <div style={{ height: 26, background: palette.accent, borderRadius: 6 }} />
        <div style={{ height: 22, margin: "0 30px", background: palette.paper, opacity: 0.35 }} />
      </div>

      <div className="grid grid-cols-2" style={{ gap: 50, marginTop: 90 }}>
        <div>
          <p style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{data.booksRead}</p>
          <p
            className="font-mono"
            style={{ fontSize: 32, letterSpacing: "0.15em", color: palette.muted }}
          >
            {data.booksRead === 1 ? "LIVRO TERMINADO" : "LIVROS TERMINADOS"}
          </p>
          {showDeltas && (
            <Delta value={data.deltas.books} against={data.previousShort} palette={palette} />
          )}
        </div>
        <div>
          <p style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>
            {data.pagesRead.toLocaleString("pt-BR")}
          </p>
          <p
            className="font-mono"
            style={{ fontSize: 32, letterSpacing: "0.15em", color: palette.muted }}
          >
            PÁGINAS LIDAS
          </p>
          {showDeltas && (
            <Delta value={data.deltas.pages} against={data.previousShort} palette={palette} />
          )}
        </div>
      </div>

      {data.favorite && (
        <p className="font-serif" style={{ fontSize: 46, marginTop: 70, fontStyle: "italic" }}>
          Favorito: {data.favorite.title}{" "}
          <span style={{ color: palette.accent2, fontStyle: "normal" }}>
            {ratingStars(data.favorite.rating)}
          </span>
        </p>
      )}

      <CardFooter username={data.username} palette={palette} style={{ marginTop: "auto" }} />
    </div>
  );
}
