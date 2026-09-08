import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const FEATURED_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const FEATURED_COST_CENTS = 2500; // $25 one-time fee

/** Get the cost to feature a listing. */
export const getFeaturedCost = query({
  args: {},
  handler: () => ({
    costCents: FEATURED_COST_CENTS,
    durationMs: FEATURED_DURATION_MS,
    durationLabel: "24 hours",
  }),
});

/** Mark a listing as featured after payment confirms. */
export const markFeatured = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found.");
    if (listing.ownerId !== userId) {
      throw new Error("You can only feature your own listing.");
    }

    await ctx.db.patch(args.listingId, {
      featured: true,
      featuredUntil: Date.now() + FEATURED_DURATION_MS,
    });

    return { ok: true };
  },
});

/** Get all currently featured listings (for display). */
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("listings").collect();
    return all
      .filter((l) => l.featured && (l.featuredUntil ?? 0) > now)
      .sort((a, b) => (b.totalPaid ?? 0) - (a.totalPaid ?? 0));
  },
});
