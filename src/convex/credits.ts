import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, MutationCtx, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ── Economy constants (1 credit = $0.01 of rank power) ──────────────────────
export const SIGNUP_BONUS_CREDITS = 100;
export const DAILY_RENEWAL_BASE = 100;
export const STREAK_BONUS_CREDITS = 10;
export const DAILY_RENEWAL_CAP = 200;
export const TRANSFER_MIN = 1;
export const TRANSFER_MAX = 500;
export const DAILY_TRANSFER_CAP = 500;

const kindValidator = v.union(
  v.literal("signup_bonus"),
  v.literal("daily_renewal"),
  v.literal("referral"),
  v.literal("transfer_in"),
  v.literal("transfer_out"),
  v.literal("bid_boost"),
  v.literal("bid_dislike"),
  v.literal("salary_boost"),
  v.literal("listing_fee"),
  v.literal("ai_usage"),
  v.literal("ai_refund"),
  v.literal("purchase"),
  v.literal("admin_grant"),
  v.literal("intro"),
);

function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey() {
  return utcDayKey(new Date(Date.now() - 86_400_000));
}

function utcDayStartMs() {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

// ── Internal ledger primitives (join the caller's transaction) ──────────────

type LedgerArgs = {
  userId: Id<"users">;
  amount: number;
  kind: typeof kindValidator.type;
  description?: string;
  counterpartyId?: Id<"users">;
  listingId?: Id<"listings">;
  jobId?: Id<"jobListings">;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  requestId?: string;
};

/** Adds credits (plain helper — joins the caller's transaction). */
async function grantLedger(
  ctx: MutationCtx,
  args: LedgerArgs,
): Promise<{ balance: number; duplicate: boolean }> {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    throw new Error("Grant amount must be a positive whole number of credits.");
  }
  if (args.requestId) {
    const dup = await ctx.db
      .query("creditLedger")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId!))
      .first();
    if (dup) return { balance: dup.balanceAfter, duplicate: true };
  }
  const user = await ctx.db.get(args.userId);
  if (!user) throw new Error("User not found.");
  const balance = (user.creditBalance ?? 0) + args.amount;
  await ctx.db.patch(args.userId, { creditBalance: balance });
  await ctx.db.insert("creditLedger", {
    userId: args.userId,
    amount: args.amount,
    kind: args.kind,
    balanceAfter: balance,
    description: args.description,
    counterpartyId: args.counterpartyId,
    listingId: args.listingId,
    jobId: args.jobId,
    model: args.model,
    tokensIn: args.tokensIn,
    tokensOut: args.tokensOut,
    requestId: args.requestId,
    createdAt: Date.now(),
  });
  return { balance, duplicate: false };
}

const ledgerArgsValidator = {
  userId: v.id("users"),
  amount: v.number(),
  kind: kindValidator,
  description: v.optional(v.string()),
  counterpartyId: v.optional(v.id("users")),
  listingId: v.optional(v.id("listings")),
  jobId: v.optional(v.id("jobListings")),
  model: v.optional(v.string()),
  tokensIn: v.optional(v.number()),
  tokensOut: v.optional(v.number()),
  requestId: v.optional(v.string()),
};

/** Cross-module wrapper (creditBids, referrals, payments…). */
export const grantCredits = internalMutation({
  args: ledgerArgsValidator,
  handler: (ctx, args) => grantLedger(ctx, args),
});

/** Spends credits (plain helper — throws when insufficient). */
async function spendLedger(
  ctx: MutationCtx,
  args: LedgerArgs,
): Promise<{ balance: number }> {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    throw new Error("Spend amount must be a positive whole number of credits.");
  }
  const user = await ctx.db.get(args.userId);
  if (!user) throw new Error("User not found.");
  const balance = user.creditBalance ?? 0;
  if (balance < args.amount) {
    throw new Error(
      `Not enough credits. You have ${balance}, this needs ${args.amount}.`,
    );
  }
  const newBalance = balance - args.amount;
  await ctx.db.patch(args.userId, { creditBalance: newBalance });
  await ctx.db.insert("creditLedger", {
    userId: args.userId,
    amount: -args.amount,
    kind: args.kind,
    balanceAfter: newBalance,
    description: args.description,
    counterpartyId: args.counterpartyId,
    listingId: args.listingId,
    jobId: args.jobId,
    model: args.model,
    tokensIn: args.tokensIn,
    tokensOut: args.tokensOut,
    requestId: args.requestId,
    createdAt: Date.now(),
  });
  return { balance: newBalance };
}

/** Cross-module wrapper (creditBids, payments…). */
export const spendCredits = internalMutation({
  args: ledgerArgsValidator,
  handler: (ctx, args) => spendLedger(ctx, args),
});

// ── Public wallet API ────────────────────────────────────────────────────────

/** Wallet snapshot for the signed-in user (null when signed out). */
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const daily = await ctx.db
      .query("creditDaily")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const today = utcDayKey();
    const canClaim = daily?.lastClaimDay !== today;
    const nextStreak =
      canClaim && daily?.lastClaimDay === yesterdayKey()
        ? daily.streak + 1
        : canClaim
          ? 1
          : (daily?.streak ?? 0);
    const nextClaimAmount = Math.min(
      DAILY_RENEWAL_BASE + Math.max(0, nextStreak - 1) * STREAK_BONUS_CREDITS,
      DAILY_RENEWAL_CAP,
    );
    return {
      balance: user.creditBalance ?? 0,
      hasSignupBonus: user.signupBonusAt !== undefined,
      streak: daily?.streak ?? 0,
      canClaim,
      nextClaimAmount,
    };
  },
});

/** Grants the one-time signup bonus on first wallet touch. Idempotent. */
export const ensureWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    if (user.signupBonusAt !== undefined) {
      return { granted: false, balance: user.creditBalance ?? 0 };
    }
    await ctx.db.patch(userId, { signupBonusAt: Date.now() });
    const { balance } = await grantLedger(ctx, {
      userId,
      amount: SIGNUP_BONUS_CREDITS,
      kind: "signup_bonus",
      description: "Welcome bonus",
    });
    return { granted: true, balance };
  },
});

/** Daily renewal: claim once per UTC day. Streak adds +10/level up to 200. */
export const claimDailyRenewal = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const today = utcDayKey();
    const daily = await ctx.db
      .query("creditDaily")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (daily?.lastClaimDay === today) {
      return { claimed: false as const, reason: "already" as const, streak: daily.streak };
    }
    const streak = daily?.lastClaimDay === yesterdayKey() ? daily.streak + 1 : 1;
    const amount = Math.min(
      DAILY_RENEWAL_BASE + (streak - 1) * STREAK_BONUS_CREDITS,
      DAILY_RENEWAL_CAP,
    );
    if (daily) {
      await ctx.db.patch(daily._id, {
        lastClaimDay: today,
        lastClaimAt: Date.now(),
        streak,
      });
    } else {
      await ctx.db.insert("creditDaily", {
        userId,
        lastClaimDay: today,
        lastClaimAt: Date.now(),
        streak,
      });
    }
    const { balance } = await grantLedger(ctx, {
      userId,
      amount,
      kind: "daily_renewal",
      description: `Daily renewal · day ${streak} streak`,
    });
    return { claimed: true as const, amount, streak, balance };
  },
});

/** Transfer credits to another member by their referral code. */
export const transferCredits = mutation({
  args: {
    toCode: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const amount = args.amount;
    if (
      !Number.isInteger(amount) ||
      amount < TRANSFER_MIN ||
      amount > TRANSFER_MAX
    ) {
      throw new Error(
        `Transfer between ${TRANSFER_MIN} and ${TRANSFER_MAX} whole credits.`,
      );
    }
    const sender = await ctx.db.get(userId);
    if (!sender) throw new Error("User not found.");
    if ((sender.creditBalance ?? 0) < amount) {
      throw new Error("Not enough credits.");
    }
    const code = args.toCode.trim().toLowerCase();
    if (sender.referralCode && code === sender.referralCode) {
      throw new Error("You can't transfer to yourself.");
    }
    const recipient = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
      .first();
    if (!recipient) throw new Error("No member found with that code.");
    if (recipient._id === userId) {
      throw new Error("You can't transfer to yourself.");
    }

    // Daily transfer cap (UTC day; transfer_out entries are negative).
    const todays = await ctx.db
      .query("creditLedger")
      .withIndex("by_user_time", (q) =>
        q.eq("userId", userId).gte("createdAt", utcDayStartMs()),
      )
      .collect();
    const sentToday = todays
      .filter((t) => t.kind === "transfer_out")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    if (sentToday + amount > DAILY_TRANSFER_CAP) {
      throw new Error(
        `Daily transfer cap is ${DAILY_TRANSFER_CAP}. You've sent ${sentToday} today.`,
      );
    }

    const fromName =
      sender.name ?? sender.email?.split("@")[0] ?? "a member";
    const note = args.note?.slice(0, 140);
    const senderRes = await spendLedger(ctx, {
      userId,
      amount,
      kind: "transfer_out",
      description: note
        ? `Sent to ${recipient.name ?? code}: ${note}`
        : `Sent to ${recipient.name ?? code}`,
      counterpartyId: recipient._id,
    });
    await grantLedger(ctx, {
      userId: recipient._id,
      amount,
      kind: "transfer_in",
      description: note
        ? `From ${fromName}: ${note}`
        : `From ${fromName}`,
      counterpartyId: userId,
    });
    return { ok: true, balance: senderRes.balance, toName: recipient.name ?? code };
  },
});

/** Recent ledger entries (newest 50) with counterparty names resolved. */
export const getLedger = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("creditLedger")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const cpIds = [
      ...new Set(
        rows
          .map((r) => r.counterpartyId)
          .filter((id): id is typeof userId => !!id),
      ),
    ];
    const nameOf = new Map<string, string>();
    for (const id of cpIds) {
      const u = await ctx.db.get(id);
      if (u) nameOf.set(id, u.name ?? u.email?.split("@")[0] ?? "Member");
    }
    return rows.map((r) => ({
      _id: r._id,
      kind: r.kind,
      amount: r.amount,
      balanceAfter: r.balanceAfter,
      description: r.description ?? null,
      counterpartyName: r.counterpartyId
        ? (nameOf.get(r.counterpartyId) ?? null)
        : null,
      createdAt: r.createdAt,
    }));
  },
});
