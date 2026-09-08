import { internalMutation } from "./_generated/server";

/**
 * Cron entry point: delete news items older than 90 days in batches
 * until the cutoff window is clean.
 */
export const _prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    let deleted = 0;
    for (;;) {
      const old = await ctx.db
        .query("newsItems")
        .withIndex("by_published", (q) => q.lt("publishedAt", cutoff))
        .take(500);
      if (old.length === 0) break;
      for (const item of old) {
        await ctx.db.delete(item._id);
      }
      deleted += old.length;
    }
    return deleted;
  },
});
