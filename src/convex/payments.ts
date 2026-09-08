"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import DodoPayments from "dodopayments";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { LISTING_FEE_CENTS, MAX_BID_CENTS, MIN_BID_CENTS } from "./listings";

function dodoClient(): DodoPayments {
  const key = process.env.DODO_PAYMENTS_API_KEY;
  if (!key) {
    throw new Error(
      "Payments aren't configured yet (missing DODO_PAYMENTS_API_KEY). Add your Dodo Payments keys in the Keys tab.",
    );
  }
  return new DodoPayments({
    bearerToken: key,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
        ? "live_mode"
        : "test_mode",
  });
}

function dodoProductId(): string {
  const id = process.env.DODO_PRODUCT_ID;
  if (!id) {
    throw new Error(
      "Payments aren't configured yet (missing DODO_PRODUCT_ID). Create a pay-what-you-want product in your Dodo dashboard and add its ID in the Keys tab.",
    );
  }
  return id;
}

/**
 * Creates a Dodo Payments hosted Checkout Session for a boost (your own
 * listing) or a dislike (paid sabotage of someone else's listing). The
 * leaderboard only moves once Dodo confirms the payment via webhook
 * (payment.succeeded).
 */
export const createCheckout = action({
  args: {
    listingId: v.optional(v.id("listings")),
    amountCents: v.number(),
    kind: v.union(
      v.literal("boost"),
      v.literal("dislike"),
      v.literal("listing"),
    ),
    origin: v.string(),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    tagline: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    if (
      !Number.isInteger(args.amountCents) ||
      args.amountCents < MIN_BID_CENTS ||
      args.amountCents > MAX_BID_CENTS ||
      args.amountCents % 100 !== 0
    ) {
      throw new Error(
        `Whole US dollars only, $${MIN_BID_CENTS / 100} minimum, $${MAX_BID_CENTS / 100} maximum.`,
      );
    }
    const origin = args.origin.startsWith("http") ? args.origin : "";
    if (!origin) throw new Error("Invalid app origin.");

    const user = await ctx.runQuery(api.users.currentUser);
    const client = dodoClient();

    let metadata: Record<string, string>;

    if (args.kind === "listing") {
      // $2 flat listing fee; the listing itself is created by the webhook
      // once the payment clears (idempotent on URL).
      if (args.amountCents !== LISTING_FEE_CENTS) {
        throw new Error("Listing fee is a flat $2.");
      }
      if (!args.title || !args.url || !args.category) {
        throw new Error("Missing listing details.");
      }
      await ctx.runMutation(internal.listings.listingFeeGuard, {
        title: args.title,
        url: args.url,
        tagline: args.tagline,
        category: args.category,
      });
      metadata = {
        bidKind: "listing",
        userId,
        amountCents: String(args.amountCents),
        title: args.title,
        url: args.url,
        tagline: args.tagline ?? "",
        category: args.category,
      };
    } else {
      if (!args.listingId) throw new Error("Listing not found.");
      const { bidId } = await ctx.runMutation(
        internal.listings.checkoutGuard,
        {
          listingId: args.listingId,
          amountCents: args.amountCents,
          kind: args.kind,
        },
      );
      if (!bidId) throw new Error("Listing not found.");
      metadata = {
        bidKind: args.kind,
        listingId: args.listingId,
        userId,
        amountCents: String(args.amountCents),
        bidId,
      };
    }

    // Dynamic pricing: `amount` is the pay-what-you-want override on the
    // configured PWYW product, in lowest denomination (cents).
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: dodoProductId(),
          quantity: 1,
          amount: args.amountCents,
        },
      ],
      customer: {
        email: user?.email ?? "anonymous@example.com",
        name: user?.name ?? "Anonymous",
      },
      metadata,
      return_url: `${origin}/board?payment=success`,
    });

    if (!session.checkout_url) throw new Error("Could not start checkout. Try again.");
    return session.checkout_url;
  },
});

// Guard runs inside a transaction: ownership rules per bid kind + pending bid.
// (Defined in listings.ts because mutations must live outside "use node" files.)
