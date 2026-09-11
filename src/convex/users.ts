import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, mutation, internalMutation } from "./_generated/server";
import {
  roleValidator,
  ROLES,
  subscriptionPlanValidator,
  subscriptionStatusValidator,
} from "./schema";
import { v } from "convex/values";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

/**
 * Assign a role to a user. Used by the payment webhook (subscription) and
 * admin panel. Internal-only — callers must enforce admin access.
 */
export const assignRole = internalMutation({
  args: {
    userId: v.id("users"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    await ctx.db.patch(args.userId, { role: args.role });
    return true;
  },
});

export const assignSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    plan: subscriptionPlanValidator,
    status: subscriptionStatusValidator,
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    await ctx.db.patch(args.userId, {
      role:
        user.role === ROLES.ADMIN
          ? ROLES.ADMIN
          : args.status === "active"
            ? ROLES.MEMBER
            : ROLES.USER,
      subscriptionPlan: args.plan,
      subscriptionStatus: args.status,
      dodoSubscriptionId: args.subscriptionId,
      dodoCustomerId: args.customerId,
      subscriptionCurrentPeriodEnd: args.currentPeriodEnd,
      subscriptionUpdatedAt: Date.now(),
    });
    return true;
  },
});

/** Apply a subscription lifecycle event idempotently from Dodo webhooks. */
export const syncSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    plan: subscriptionPlanValidator,
    status: subscriptionStatusValidator,
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    const patch = {
      role:
        user.role === ROLES.ADMIN
          ? ROLES.ADMIN
          : args.status === "active"
            ? ROLES.MEMBER
            : ROLES.USER,
      subscriptionPlan: args.plan,
      subscriptionStatus: args.status,
      ...(args.subscriptionId
        ? { dodoSubscriptionId: args.subscriptionId }
        : {}),
      ...(args.customerId ? { dodoCustomerId: args.customerId } : {}),
      ...(args.currentPeriodEnd
        ? { subscriptionCurrentPeriodEnd: args.currentPeriodEnd }
        : {}),
      subscriptionUpdatedAt: Date.now(),
    };
    await ctx.db.patch(args.userId, patch);
    return true;
  },
});


export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const patches: Record<string, string> = {};
    if (args.name !== undefined) patches.name = args.name;
    if (args.image !== undefined) patches.image = args.image;
    if (Object.keys(patches).length > 0) {
      await ctx.db.patch(userId, patches);
    }
    return true;
  },
});

/**
 * Generate a referral code for the current user (idempotent).
 */
export const ensureReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found.");
    if (user.referralCode) return user.referralCode;

    const code = `${(user.name ?? "user").toLowerCase().replace(/\s+/g, "-")}-${userId.slice(-6)}`;
    await ctx.db.patch(userId, { referralCode: code });
    return code;
  },
});
