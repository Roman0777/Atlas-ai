import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ONLINE_WINDOW_MS = 3 * 60 * 1000; // seen in the last 3 minutes = online

/** Client heartbeat: upserts this browser session's last-seen time. */
export const trackVisit = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("visits")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now });
      return;
    }
    await ctx.db.insert("visits", {
      sessionId: args.sessionId,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  },
});

export const getVisitorStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - ONLINE_WINDOW_MS;
    const recent = await ctx.db
      .query("visits")
      .withIndex("by_last_seen", (q) => q.gt("lastSeenAt", cutoff))
      .collect();
    const total = await ctx.db.query("visits").collect();
    return {
      online: recent.length,
      total: total.length,
    };
  },
});
