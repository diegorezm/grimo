/**
 * Open Library synopses are loosely Markdown and often end with a source/links block.
 * Keep the prose: drop emphasis markers and link syntax, and cut at the first `----` rule.
 */
export function cleanDescription(text: string): string {
  return text
    .split(/\n-{3,}/)[0]!
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[\d+\]/g, "$1")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/\(\[source\]\[\d+\]\)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
