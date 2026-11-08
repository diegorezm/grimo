import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Deletes a list and its items (its owner, moderation or account deletion). */
export async function deleteList(ctx: MutationCtx, list: Doc<"lists">) {
  const items = await ctx.db
    .query("listItems")
    .withIndex("by_list_added", (q) => q.eq("listId", list._id))
    .collect();
  for (const item of items) await ctx.db.delete(item._id);
  await ctx.db.delete(list._id);
}
