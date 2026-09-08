import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ---------- Job listings CRUD ----------

export const _getBySourceAndExternal = internalQuery({
  args: { source: v.string(), externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobListings")
      .withIndex("by_source_external", (q) =>
        q.eq("source", args.source).eq("externalId", args.externalId),
      )
      .take(1);
  },
});

export const _insertJob = internalMutation({
  args: {
    source: v.string(),
    externalId: v.string(),
    title: v.string(),
    companyName: v.string(),
    location: v.optional(v.string()),
    isRemote: v.boolean(),
    url: v.string(),
    description: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    postedAt: v.optional(v.number()),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("jobListings", args);
  },
});

export const _updateJob = internalMutation({
  args: {
    id: v.id("jobListings"),
    title: v.string(),
    companyName: v.string(),
    location: v.optional(v.string()),
    isRemote: v.boolean(),
    url: v.string(),
    description: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    postedAt: v.optional(v.number()),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// ---------- Sync metadata ----------

export const _getSyncMeta = internalQuery({
  args: { source: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("jobSyncMeta")
      .withIndex("by_source", (q) => q.eq("source", args.source))
      .take(1);
    return results.length > 0 ? results[0] : null;
  },
});

export const _updateSyncMeta = internalMutation({
  args: {
    id: v.id("jobSyncMeta"),
    jobCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastSyncAt: Date.now(),
      jobCount: args.jobCount,
    });
  },
});

export const _insertSyncMeta = internalMutation({
  args: {
    source: v.string(),
    lastSyncAt: v.number(),
    jobCount: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("jobSyncMeta", args);
  },
});
