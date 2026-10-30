import { type ReportTarget, timeAgo } from "@grimo/core";

export const TARGET_LABELS: Record<ReportTarget, string> = {
  post: "Publicação",
  comment: "Comentário",
  user: "Perfil",
  message: "Mensagem no Juntos",
  list: "Lista",
};

/** Pill for a report's type, reason and count. */
export const CHIP =
  "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap";

/** Small mono label above a block of information. */
export const LABEL = "font-mono text-[11px] uppercase tracking-wider text-text-muted";

/** "há 3 d" for an epoch in ms. */
export const ago = (ms: number) => timeAgo(new Date(ms));

/** "1 curtida" / "3 curtidas". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Query string that opens (or closes, with no value) one of the panel's side peeks. */
export const peekSearch = (peek: { report?: string; review?: string }) => (prev: object) => ({
  ...prev,
  book: undefined,
  post: undefined,
  panel: undefined,
  report: peek.report,
  review: peek.review,
});
