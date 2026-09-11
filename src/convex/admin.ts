import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/** Admin-only operational snapshot. Authorization is enforced server-side. */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const actor = await ctx.db.get(userId);
    if (actor?.role !== "admin") throw new Error("Admin access required.");

    const [users, listings, bids] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("bids").withIndex("by_created_at").order("desc").take(20),
    ]);

    return {
      userCount: users.length,
      listingCount: listings.length,
      activeSubscriptions: users.filter(
        (u) => u.subscriptionStatus === "active",
      ).length,
      paidBids: bids.filter((b) => b.status === "paid").length,
      recentBids: bids.map((bid) => ({
        _id: bid._id,
        amount: bid.amount,
        kind: bid.kind,
        status: bid.status,
        createdAt: bid.createdAt,
      })),
    };
  },
});
