import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { activityPage, listActivities } from "./model/content";
import { listLimit } from "./model/limits";
import { requireViewer } from "./model/readers";
import { blockedIds } from "./model/safety";

/** People the feed reads (the earliest follows, by index order) and activities read per person. */
const FEED_MAX_ACTORS = 100;
const FEED_PER_ACTOR = 40;
/** Activities the community feed looks past (follows, blocked readers) before it stops. */
const COMMUNITY_MAX_SKIPPED = 200;

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

/**
 * "Comunidade": what everyone on Grimo is reading, newest first, so the feed is never empty for
 * someone who follows few readers. Follows stay out (they're about people, not books), and so
 * does anything from or about readers the viewer blocked or was blocked by.
 */
export const community = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const limit = listLimit(args.limit);
    const blocked = await blockedIds(ctx, viewer._id);
    const picked: Doc<"activities">[] = [];
    let skipped = 0;
    for await (const activity of ctx.db.query("activities").withIndex("by_created").order("desc")) {
      const keep =
        activity.kind !== "followed" &&
        !blocked.has(activity.actorId) &&
        !(activity.targetUserId && blocked.has(activity.targetUserId));
      if (keep) picked.push(activity);
      else skipped += 1;
      if (picked.length > limit || skipped > COMMUNITY_MAX_SKIPPED) break;
    }
    return activityPage(ctx, picked, viewer._id, limit);
  },
});
