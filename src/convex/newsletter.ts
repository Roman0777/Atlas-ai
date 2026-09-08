import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ---------- Double opt-in newsletter (The Atlas Dispatch) ----------

/** Look up a pending confirmation token (used by the /news?confirm= flow). */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email")
      .collect();
    // Token lookup without a dedicated index; table stays small.
    return rows.find((r) => r.confirmToken === args.token) ?? null;
  },
});

/** Confirm a subscription (idempotent). */
export const confirmSubscription = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email")
      .collect();
    const subscriber = rows.find((r) => r.confirmToken === args.token);
    if (!subscriber) return "not_found" as const;
    if (subscriber.confirmed) return "already_confirmed" as const;
    await ctx.db.patch(subscriber._id, {
      confirmed: true,
      confirmToken: undefined,
    });
    return "confirmed" as const;
  },
});

/** Unsubscribe by email — linked from the confirmation email footer. */
export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    return existing.length > 0 ? "removed" : "not_found";
  },
});

/** Begin the double opt-in flow: store the address, email the link. */
export const subscribeNewsletter = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .take(1);
    if (existing.length > 0) {
      if (existing[0].confirmed) return "already_subscribed" as const;
      // Pending: refresh the token so the user can request a new email.
      const token = crypto.randomUUID();
      await ctx.db.patch(existing[0]._id, {
        confirmToken: token,
        confirmSentAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, api.news.sendConfirmationEmail, {
        to: email,
        token,
      });
      return "confirmation_sent" as const;
    }

    const token = crypto.randomUUID();
    await ctx.db.insert("newsletterSubscribers", {
      email,
      subscribedAt: Date.now(),
      confirmed: false,
      confirmToken: token,
      confirmSentAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.news.sendConfirmationEmail, {
      to: email,
      token,
    });
    return "confirmation_sent" as const;
  },
});

/** Admin/dev helper: subscriber count (used on the News page hero). */
export const getSubscriberCount = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("newsletterSubscribers").collect();
    return all.filter((s) => s.confirmed).length;
  },
});
