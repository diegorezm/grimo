import { v } from "convex/values";
import { query } from "./_generated/server";
import { listActivities } from "./model/content";
import { listLimit } from "./model/limits";
import { requireViewer } from "./model/readers";

/** People the feed reads (the earliest follows, by index order) and activities read per person. */
const FEED_MAX_ACTORS = 100;
const FEED_PER_ACTOR = 40;

/** Fan-out-on-read feed: my activities + activities of people I follow, newest first. */
export const list = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => q.eq("followerId", viewer._id))
      .take(FEED_MAX_ACTORS);
    const actors = [viewer._id, ...follows.map((follow) => follow.followingId)];
    return listActivities(ctx, actors, viewer._id, listLimit(args.limit), FEED_PER_ACTOR);
  },
});
