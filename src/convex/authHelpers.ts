import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx } from "./_generated/server";
import { ROLES } from "./schema";

/**
 * Get the current signed-in user's role. Returns null if not signed in.
 * Usage: const role = await ctx.runQuery(api.authHelpers.myRole);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const myRole = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return user.role ?? ROLES.USER;
  },
});

/**
 * Require a specific role. Throws if the user is not signed in or lacks the role.
 * Usage: await ctx.runMutation(api.authHelpers.requireAdmin);
 */
export const requireAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in first.");
    if (user.role !== ROLES.ADMIN) {
      throw new Error("Admin access required.");
    }
    return true;
  },
});

export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
};
