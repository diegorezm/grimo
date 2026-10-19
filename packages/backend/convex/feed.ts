import { v } from "convex/values";
import { query } from "./_generated/server";
import { listActivities } from "./model/content";
import { listLimit } from "./model/limits";
import { requireViewer } from "./model/readers";

/** Fan-out-on-read feed: my activities + activities of people I follow, newest first. */
export const list = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => q.eq("followerId", viewer._id))
      .collect();
    const actors = [viewer._id, ...follows.map((follow) => follow.followingId)];
    return listActivities(ctx, actors, viewer._id, listLimit(args.limit));
  },
});
