import type { PostKind } from "../posts/schemas";

export const NOTIFICATION_KINDS = ["follow", "like", "comment", "mention"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Readers one post or comment can notify by @: enough for a conversation, not a broadcast. */
export const MAX_MENTIONS = 10;

/**
 * `@username` not glued to a word before it (so emails don't count). Usernames are
 * `[a-z0-9_.]{3,30}`; a dot at the end is the sentence's, not the name's.
 */
const MENTION = /(^|[^a-zA-Z0-9_.@])@([a-zA-Z0-9_.]{3,30})/g;

const clean = (name: string) => name.replace(/\.+$/, "").toLowerCase();

/** The distinct usernames mentioned in `text`, in order, at most `MAX_MENTIONS`. */
export function extractMentions(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(MENTION)) {
    const name = clean(match[2] ?? "");
    if (name.length >= 3) names.add(name);
    if (names.size === MAX_MENTIONS) break;
  }
  return [...names];
}

export type TextSegment = { text: string } | { text: string; username: string };

/** `text` cut into plain runs and @mentions, so each app can render mentions as links. */
export function splitMentions(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(MENTION)) {
    const raw = match[2] ?? "";
    const username = clean(raw);
    if (username.length < 3) continue;
    const start = (match.index ?? 0) + (match[1] ?? "").length;
    const end = start + 1 + raw.replace(/\.+$/, "").length;
    if (start > last) segments.push({ text: text.slice(last, start) });
    segments.push({ text: text.slice(start, end), username });
    last = end;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** What happened, after the actor's name: "Rafa curtiu sua resenha". */
export function describeNotification(
  kind: NotificationKind,
  context: { postKind?: PostKind | null; inComment?: boolean } = {},
): string {
  const post =
    context.postKind === "review"
      ? "sua resenha"
      : context.postKind === "update"
        ? "sua atualização"
        : "sua nota";
  switch (kind) {
    case "follow":
      return "começou a seguir você";
    case "like":
      return `curtiu ${post}`;
    case "comment":
      return `comentou na ${post}`;
    case "mention":
      return context.inComment ? "mencionou você em um comentário" : "mencionou você em um post";
  }
}

/** Badge text: "3", or "99+" past that. */
export const unreadBadge = (count: number) => (count > 99 ? "99+" : String(count));
