import { type BookStoryData, formatCardRating } from "@grimo/core";
import type { CardPalette } from "@grimo/tokens";

export interface FinishedCardProps {
  data: BookStoryData;
  palette: CardPalette;
  showDetails?: boolean;
}

/** Crisp 0–5 star row + formatted decimal rating ("4,5"). */
export function RatingRow({
  rating,
  color,
  muted,
  size = 36,
}: {
  rating: number | null;
  color: string;
  muted: string;
  size?: number;
}) {
  if (!rating || rating <= 0) return null;
  const full = Math.round(rating);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.45 }}>
      <span style={{ fontSize: size, color, letterSpacing: "0.08em", lineHeight: 1 }}>
        {"★".repeat(Math.min(5, full))}
        <span style={{ opacity: 0.25 }}>{"★".repeat(Math.max(0, 5 - full))}</span>
      </span>
      <span
        className="font-mono"
        style={{ fontSize: size * 0.8, color: muted, letterSpacing: "0.06em" }}
      >
        {formatCardRating(rating)}
      </span>
    </div>
  );
}

/** Compact detail pills built from whichever book/entry metadata exists. */
export function buildDetailPills(
  data: BookStoryData,
  showDetails: boolean,
): { label: string; accent?: boolean }[] {
  const d = data.details;
  if (!d) return [];
  const pills: { label: string; accent?: boolean }[] = [];
  if (d.pages) pills.push({ label: `${d.pages} PÁG` });
  if (d.days !== null) pills.push({ label: `${d.days} ${d.days === 1 ? "DIA" : "DIAS"}` });
  if (showDetails && d.pagesPerDay) pills.push({ label: `${d.pagesPerDay} PÁG/DIA` });
  if (showDetails && d.genre && pills.length < 4) {
    pills.push({ label: d.genre.toUpperCase() });
  }
  if (showDetails && d.feelings[0]) {
    pills.push({ label: d.feelings[0].toUpperCase(), accent: true });
  }
  return pills.slice(0, 4);
}
