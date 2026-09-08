import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { REFERRAL_CREDIT_CENTS } from "./listings";

// Tiered referral rewards: more referrals = more credit per invite.
const TIERS = [
  { min: 31, creditCents: 1000, label: "Gold" },   // $10 per referral
  { min: 16, creditCents: 500, label: "Silver" },   // $5 per referral
  { min: 6, creditCents: 300, label: "Bronze" },    // $3 per referral
  { min: 0, creditCents: REFERRAL_CREDIT_CENTS, label: "Starter" }, // $2
];

function tierCredit(referralCount: number): number {
  for (const t of TIERS) {
    if (referralCount >= t.min) return t.creditCents;
  }
  return REFERRAL_CREDIT_CENTS;
}

function tierLabel(referralCount: number): string {
  for (const t of TIERS) {
    if (referralCount >= t.min) return t.label;
  }
  return "Starter";
}

function randomCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** The signed-in user's referral code, creating one on first call. */
export const getMyReferral = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    if (user.referralCode) {
      return {
        code: user.referralCode,
        referralCount: user.referralCount ?? 0,
      };
    }

    // Queries can't write — generate deterministically from the user id so
    // the same code is returned until a mutation persists it.
    return {
      code: userId.replace(/[a-z-]/g, "").slice(-8) || userId.slice(-8),
      referralCount: user.referralCount ?? 0,
    };
  },
});

/** Persists a referral code for the caller if they don't have one yet. */
export const ensureReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    if (user.referralCode) {
      return { code: user.referralCode, referralCount: user.referralCount ?? 0 };
    }
    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      const clash = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
        .first();
      if (!clash) break;
      code = randomCode();
    }
    await ctx.db.patch(userId, { referralCode: code });
    return { code, referralCount: user.referralCount ?? 0 };
  },
});

/** Public referral leaderboard: the builders who brought the most people in. */
export const getTopReferrers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const top = users
      .filter((u) => (u.referralCount ?? 0) > 0)
      .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
      .slice(0, 10)
      .map((u, i) => ({
        rank: i + 1,
        name: u.name ?? u.email?.split("@")[0] ?? "Anonymous builder",
        referralCount: u.referralCount ?? 0,
        creditCents: (u.referralCount ?? 0) * tierCredit(u.referralCount ?? 0),
      tier: tierLabel(u.referralCount ?? 0),
      }));
    return top;
  },
});

/** Called by a signed-in newcomer visiting ?ref=CODE. One referral per user,
 *  never self. Credits the referrer's most-banked listing with rank credit. */
export const claimReferral = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to accept a referral.");

    const already = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q) => q.eq("referredId", userId))
      .first();
    if (already) return { applied: false, reason: "already-referred" };

    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.code))
      .first();
    if (!referrer) return { applied: false, reason: "bad-code" };
    if (referrer._id === userId) return { applied: false, reason: "self" };

    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referredId: userId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(referrer._id, {
      referralCount: (referrer.referralCount ?? 0) + 1,
    });

    // Wallet reward: the same tiered amount lands as spendable credits
    // (1 credit = $0.01, matching the tier creditCents values).
    await ctx.runMutation(internal.credits.grantCredits, {
      userId: referrer._id,
      amount: tierCredit((referrer.referralCount ?? 0) + 1),
      kind: "referral",
      description: "Referral joined with your code",
    });

    // Apply the credit to the referrer's most-banked listing (if any).
    const mine = await ctx.db
      .query("listings")
      .withIndex("by_owner", (q) => q.eq("ownerId", referrer._id))
      .collect();
    let creditedTitle: string | null = null;
    if (mine.length > 0) {
      const top = mine.reduce((a, b) =>
        (b.totalPaid + b.starCount) > (a.totalPaid + a.starCount) ? b : a,
      );
      const creditForThis = tierCredit((referrer.referralCount ?? 0) + 1);
      await ctx.db.patch(top._id, {
        referralCreditCents:
          (top.referralCreditCents ?? 0) + creditForThis,
      });
      creditedTitle = top.title;
    }

    return { applied: true, creditedTitle };
  },
});
