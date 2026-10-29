import type { CardPalette } from "@grimo/tokens";
import type { CSSProperties } from "react";
import type { CardBook } from "./types";

/** Four-point sparkle at any size and color. */
export function CardSparkle({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: CSSProperties;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} style={style}>
      <path
        d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"
        fill={color}
      />
    </svg>
  );
}

/** "▲ 20% vs set." — or nothing without a baseline. */
export function Delta({
  value,
  against,
  palette,
}: {
  value: number | null;
  against: string;
  palette: CardPalette;
}) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <p className="font-mono" style={{ fontSize: 30, marginTop: 12, color: palette.muted }}>
      <span style={{ color: up ? palette.accent2 : palette.accent }}>
        {up ? "▲" : "▼"} {Math.abs(value)}%
      </span>{" "}
      vs {against}
    </p>
  );
}

/** Book cover for the exported image (CORS-enabled so html-to-image can draw it). */
export function CardCover({
  book,
  width,
  palette,
  style,
}: {
  book: CardBook;
  width: number;
  palette: CardPalette;
  style?: CSSProperties;
}) {
  const box: CSSProperties = {
    width,
    height: width * 1.5,
    borderRadius: 18,
    objectFit: "cover",
    boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
    ...style,
  };
  if (!book.coverUrl) {
    return (
      <div
        className="font-serif"
        style={{
          ...box,
          background: palette.paper,
          color: palette.ink,
          display: "grid",
          placeItems: "center",
          padding: 40,
          textAlign: "center",
          fontSize: width / 7,
          fontStyle: "italic",
        }}
      >
        {book.title}
      </div>
    );
  }
  return <img src={book.coverUrl} alt="" crossOrigin="anonymous" style={box} />;
}

/** "@rafa · grimo" footer line. */
export function CardFooter({
  username,
  palette,
  style,
}: {
  username: string | null;
  palette: CardPalette;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: palette.muted,
        ...style,
      }}
    >
      <span
        className="font-serif"
        style={{ fontSize: 56, fontStyle: "italic", color: palette.ink }}
      >
        ✦ grimo
      </span>
      {username && (
        <span className="font-mono" style={{ fontSize: 32, letterSpacing: "0.1em" }}>
          @{username}
        </span>
      )}
    </div>
  );
}
