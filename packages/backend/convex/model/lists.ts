import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isBookVisible } from "./safety";

/** Covers shown on a list's tile. */
const TILE_COVERS = 4;

/** A list as a tile (profile, picker): title, count and the first covers. */
export async function listTile(ctx: QueryCtx, list: Doc<"lists">, viewerId: Id<"users"> | null) {
  const items = await ctx.db
    .query("listItems")
    .withIndex("by_list_added", (q) => q.eq("listId", list._id))
    .take(TILE_COVERS * 2);
  const books = await Promise.all(items.map((item) => ctx.db.get(item.bookId)));
  return {
    id: list._id,
    title: list.title,
    description: list.description,
    itemCount: list.itemCount,
    updatedAt: list.updatedAt,
    covers: books
      .filter((book): book is Doc<"books"> => book !== null && isBookVisible(book, viewerId))
      .slice(0, TILE_COVERS)
      .map((book) => ({ title: book.title, coverUrl: book.coverUrl })),
  };
}

/** Deletes a list and its items (its owner, moderation or account deletion). */
export async function deleteList(ctx: MutationCtx, list: Doc<"lists">) {
  const items = await ctx.db
    .query("listItems")
    .withIndex("by_list_added", (q) => q.eq("listId", list._id))
    .collect();
  for (const item of items) await ctx.db.delete(item._id);
  await ctx.db.delete(list._id);
}
