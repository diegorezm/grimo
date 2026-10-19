import type { ReactNode } from "react";
import { isDark, stars } from "../parts";
import type { CardProps } from "../types";

/** Saw-tooth edge for the top and bottom of the receipt. */
function edge(color: string, flip: boolean) {
  return {
    height: 28,
    background: `linear-gradient(${flip ? "-45deg" : "45deg"}, transparent 14px, ${color} 0) 0 0 / 28px 28px repeat-x, linear-gradient(${flip ? "45deg" : "-45deg"}, transparent 14px, ${color} 0) 0 0 / 28px 28px repeat-x`,
    transform: flip ? "rotate(180deg)" : undefined,
  };
}

/** The month as a store receipt: itemized books, totals and a barcode. */
export function ReciboCard({ data, palette, showDeltas }: CardProps) {
  // Receipts are printed on light paper, whatever the palette.
  const dark = isDark(palette.bg);
  const paper = dark ? palette.ink : palette.paper;
  const ink = dark ? palette.bg : palette.ink;
  const muted = dark ? `${palette.bg}A6` : palette.muted;
  const books = data.books.slice(0, 5);
  const delta = (value: number | null) =>
    showDeltas && value !== null ? ` (${value >= 0 ? "+" : ""}${value}%)` : "";

  return (
    <div
      className="font-mono flex h-full w-full items-center justify-center"
      style={{ background: palette.bg, padding: 80 }}
    >
      <div
        style={{
          width: 860,
          transform: "rotate(-1.5deg)",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.3))",
        }}
      >
        <div style={edge(paper, false)} />
        <div style={{ background: paper, color: ink, padding: "40px 70px 50px", fontSize: 34 }}>
          <p style={{ textAlign: "center", fontSize: 64, fontWeight: 600, letterSpacing: "0.1em" }}>
            ✦ GRIMO ✦
          </p>
          <p style={{ textAlign: "center", color: muted }}>LIVRARIA DO EU · DESDE SEMPRE</p>
          <Rule color={muted} />
          <p style={{ textAlign: "center", fontSize: 38 }}>
            RESUMO DE {data.monthLabel.toUpperCase()}
          </p>
          <p style={{ textAlign: "center", color: muted }}>CLIENTE: {data.name.toUpperCase()}</p>
          <Rule color={muted} />

          {books.length === 0 ? (
            <p style={{ color: muted }}>NENHUM LIVRO FECHADO ESTE MÊS</p>
          ) : (
            books.map((book) => (
              <Line
                key={book.title}
                left={`1x ${book.title.toUpperCase()}`}
                right={stars(book.rating)}
                muted={muted}
              />
            ))
          )}
          {data.books.length > books.length && (
            <p style={{ color: muted }}>+ {data.books.length - books.length} OUTROS</p>
          )}
          <Rule color={muted} />

          <Line
            left="LIVROS LIDOS"
            right={`${data.booksRead}${delta(data.deltas.books)}`}
            muted={muted}
          />
          <Line left="GÊNERO DO MÊS" right={(data.genre ?? "—").toUpperCase()} muted={muted} />
          <Line
            left={`META ${data.year}`}
            right={data.goal ? `${data.goal.done}/${data.goal.target}` : "—"}
            muted={muted}
          />
          <Rule color={muted} />
          <div className="flex items-end justify-between" style={{ fontSize: 56, fontWeight: 600 }}>
            <span>TOTAL</span>
            <span>{data.pagesRead.toLocaleString("pt-BR")} PÁG</span>
          </div>
          {showDeltas && data.deltas.pages !== null && (
            <p style={{ textAlign: "right", color: muted }}>
              {delta(data.deltas.pages).trim()} VS {data.previousShort.toUpperCase()}
            </p>
          )}
          <Rule color={muted} />
          <p style={{ textAlign: "center", marginTop: 10 }}>OBRIGADO PELA LEITURA!</p>
          <p style={{ textAlign: "center", color: muted }}>VOLTE SEMPRE ✦</p>
          {/* Barcode */}
          <div
            style={{
              height: 130,
              margin: "40px 30px 14px",
              background: `repeating-linear-gradient(90deg, ${ink} 0 6px, transparent 6px 10px, ${ink} 10px 12px, transparent 12px 20px, ${ink} 20px 28px, transparent 28px 32px)`,
            }}
          />
          {data.username && (
            <p style={{ textAlign: "center", letterSpacing: "0.4em", fontSize: 28 }}>
              @{data.username}
            </p>
          )}
        </div>
        <div style={edge(paper, true)} />
      </div>
    </div>
  );
}

function Rule({ color }: { color: string }) {
  return <div style={{ borderTop: `4px dashed ${color}`, margin: "30px 0", opacity: 0.6 }} />;
}

function Line({ left, right, muted }: { left: ReactNode; right: ReactNode; muted: string }) {
  return (
    <div className="flex items-end" style={{ gap: 16, margin: "10px 0" }}>
      <span
        style={{
          maxWidth: 520,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {left}
      </span>
      <span
        style={{ flex: 1, borderBottom: `4px dotted ${muted}`, marginBottom: 10, opacity: 0.6 }}
      />
      <span style={{ whiteSpace: "nowrap" }}>{right}</span>
    </div>
  );
}
