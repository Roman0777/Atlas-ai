import { v } from "convex/values";
import { query } from "./_generated/server";

/** Latest stories across all sources, newest first. */
export const listNews = query({
  args: {
    category: v.optional(v.string()),
    sourceKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 60, 200);
    if (args.category) {
      return await ctx.db
        .query("newsItems")
        .withIndex("by_category_published", (q) =>
          q.eq("category", args.category!),
        )
        .order("desc")
        .take(limit);
    }
    let results = await ctx.db
      .query("newsItems")
      .withIndex("by_published")
      .order("desc")
      .take(400);
    if (args.sourceKey) {
      results = results.filter((n) => n.sourceKey === args.sourceKey);
    }
    return results.slice(0, limit);
  },
});

/** One story per category — the "front page" digest rail. */
export const getDigest = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db
      .query("newsItems")
      .withIndex("by_published")
      .order("desc")
      .take(400);
    const seen = new Set<string>();
    const digest: typeof recent = [];
    for (const item of recent) {
      if (seen.has(item.category)) continue;
      seen.add(item.category);
      digest.push(item);
      if (digest.length >= 12) break;
    }
    return digest;
  },
});

/** Aggregate stats for the hero strip + source filter list. */
export const getNewsStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("newsItems").collect();
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const n of all) {
      bySource[n.sourceKey] = (bySource[n.sourceKey] ?? 0) + 1;
      byCategory[n.category] = (byCategory[n.category] ?? 0) + 1;
    }
    return { total: all.length, bySource, byCategory };
  },
});

/** Per-source sync metadata so the UI can show freshness/status. */
export const getNewsSyncMeta = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("newsSyncMeta").collect();
  },
});
