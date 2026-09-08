import { v } from "convex/values";
import { query } from "./_generated/server";

/** Search and filter job listings. */
export const searchJobs = query({
  args: {
    q: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    // If filtering by category, use the index
    if (args.category) {
      results = await ctx.db
        .query("jobListings")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(200);
    } else {
      results = await ctx.db
        .query("jobListings")
        .withIndex("by_fetched_at")
        .order("desc")
        .take(200);
    }

    // Apply filters
    if (args.remote !== undefined) {
      results = results.filter((j) => j.isRemote === args.remote);
    }
    if (args.source) {
      results = results.filter((j) => j.source === args.source);
    }
    if (args.salaryMin) {
      results = results.filter(
        (j) => (j.salaryMax ?? j.salaryMin ?? 0) >= args.salaryMin!,
      );
    }
    if (args.q) {
      const q = args.q.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          j.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return results;
  },
});

/** Get sync metadata so the UI can show last-refresh time. */
export const getSyncMeta = query({
  args: {},
  handler: async (ctx) => {
    const metas = await ctx.db.query("jobSyncMeta").collect();
    return metas;
  },
});

/** Get total job count per source. */
export const getJobStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("jobListings").collect();
    const bySource: Record<string, number> = {};
    let remoteCount = 0;
    for (const j of all) {
      bySource[j.source] = (bySource[j.source] ?? 0) + 1;
      if (j.isRemote) remoteCount++;
    }
    return { total: all.length, bySource, remoteCount };
  },
});
