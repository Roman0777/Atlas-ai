import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ---------- News item CRUD (used by the sync action) ----------

export const _getBySourceAndExternal = internalQuery({
  args: { sourceKey: v.string(), externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("newsItems")
      .withIndex("by_source_external", (q) =>
        q.eq("sourceKey", args.sourceKey).eq("externalId", args.externalId),
      )
      .take(1);
  },
});

export const _insertItem = internalMutation({
  args: {
    sourceKey: v.string(),
    sourceName: v.string(),
    sourceUrl: v.string(),
    category: v.string(),
    externalId: v.string(),
    title: v.string(),
    url: v.string(),
    summary: v.optional(v.string()),
    author: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    publishedAt: v.number(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("newsItems", args);
  },
});

export const _updateItem = internalMutation({
  args: {
    id: v.id("newsItems"),
    title: v.string(),
    url: v.string(),
    summary: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    publishedAt: v.number(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// ---------- Sync metadata ----------

export const _getSyncMeta = internalQuery({
  args: { sourceKey: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("newsSyncMeta")
      .withIndex("by_source", (q) => q.eq("sourceKey", args.sourceKey))
      .take(1);
    return results.length > 0 ? results[0] : null;
  },
});

export const _insertSyncMeta = internalMutation({
  args: {
    sourceKey: v.string(),
    lastSyncAt: v.number(),
    status: v.string(),
    itemsAdded: v.number(),
    itemCount: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("newsSyncMeta", args);
  },
});

export const _updateSyncMeta = internalMutation({
  args: {
    id: v.id("newsSyncMeta"),
    lastSyncAt: v.number(),
    status: v.string(),
    itemsAdded: v.number(),
    itemCount: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastSyncAt: args.lastSyncAt,
      status: args.status,
      itemsAdded: args.itemsAdded,
      itemCount: args.itemCount,
      error: args.error,
    });
  },
});

// ---------- Housekeeping ----------

/** Delete news items older than 90 days to keep the table lean. */
export const _pruneOldNews = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    const old = await ctx.db
      .query("newsItems")
      .withIndex("by_published", (q) => q.lt("publishedAt", args.before))
      .take(500);
    for (const item of old) {
      await ctx.db.delete(item._id);
    }
    return old.length;
  },
});
