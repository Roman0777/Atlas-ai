import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/** User notification preferences. */
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return {
      email: user?.email,
      // Default: notifications on
      emailOnOutbid: true,
      emailOnRankChange: true,
      emailOnNewStar: true,
    };
  },
});

// Notifications are stored in-memory via toast + confetti for now.
// Full notification persistence can be added when the schema is extended.

// Placeholder for future notification persistence.

/** Get unread notification count — returns 0 until notifications table is added. */
export const getUnreadCount = query({
  args: {},
  handler: async () => 0,
});
