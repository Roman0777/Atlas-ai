import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { MAX_BID_CENTS, MIN_BID_CENTS } from "./listings";

/**
 * Credit-funded bids on the pay-to-rank board. 1 credit = 1 cent of rank
 * power, so a 500-credit boost moves a listing exactly like a $5 boost.
 * Spends from the wallet ledger and reuses the same application logic as
 * money bids (internal.listings.applyPaidBid) — lock rules, "today" scores
 * and rank math stay identical. Runs in a single transaction.
 */
export const bidWithCredits = mutation({
  args: {
    listingId: v.id("listings"),
    kind: v.union(v.literal("boost"), v.literal("dislike")),
    amountCents: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    ok: true;
    balance: number;
    resultingTotal: number;
    title: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    if (
      !Number.isInteger(args.amountCents) ||
      args.amountCents < MIN_BID_CENTS ||
      args.amountCents > MAX_BID_CENTS
    ) {
      throw new Error(
        `Whole credits only, ${MIN_BID_CENTS} minimum, ${MAX_BID_CENTS} maximum.`,
      );
    }

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found.");
    if (args.kind === "boost" && listing.ownerId !== userId) {
      throw new Error("You can only boost your own listing.");
    }
    if (args.kind === "dislike" && listing.ownerId === userId) {
      throw new Error("You can't sabotage your own listing.");
    }

    const { balance } = await ctx.runMutation(internal.credits.spendCredits, {
      userId,
      amount: args.amountCents,
      kind: args.kind === "boost" ? "bid_boost" : "bid_dislike",
      description: `${args.kind === "boost" ? "Boost" : "Sabotage"}: ${listing.title}`,
      listingId: args.listingId,
    });

    const bidId = await ctx.db.insert("bids", {
      listingId: args.listingId,
      userId,
      kind: args.kind,
      amount: args.amountCents,
      resultingTotal: -1, // set by applyPaidBid's listing patch below
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.runMutation(internal.listings.applyPaidBid, {
      bidId,
      paymentId: `credits:${bidId}`,
    });

    const resultingTotal =
      args.kind === "boost"
        ? listing.totalPaid + args.amountCents
        : Math.max(0, listing.totalPaid - args.amountCents);

    return { ok: true, balance, resultingTotal, title: listing.title };
  },
});
