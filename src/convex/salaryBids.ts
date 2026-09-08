import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Minimum boost amount in cents ($1) */
const MIN_BOOST_CENTS = 100;

/**
 * Place a salary bid on a job listing.
 * Bidder proposes their desired salary — lower salary = more attractive to employer.
 * Free to bid once; pay to boost above other bids.
 */
export const placeBid = mutation({
  args: {
    jobId: v.id("jobListings"),
    desiredSalary: v.number(),
    message: v.optional(v.string()),
    yearsExp: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    boostCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to bid on a job.");

    const user = await ctx.db.get(userId);
    const userName = user?.name ?? "Anonymous";

    // Check if user already has a bid on this job — update it
    const existing = await ctx.db
      .query("salaryBids")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .take(1);

    if (existing.length > 0) {
      // Update existing bid
      await ctx.db.patch(existing[0]._id, {
        desiredSalary: args.desiredSalary,
        message: args.message,
        yearsExp: args.yearsExp,
        skills: args.skills,
        isBoosted: Boolean(args.boostCents && args.boostCents >= MIN_BOOST_CENTS),
        boostCents: args.boostCents ?? existing[0].boostCents,
      });
      return existing[0]._id;
    }

    // Create new bid
    return ctx.db.insert("salaryBids", {
      jobId: args.jobId,
      userId,
      userName,
      desiredSalary: args.desiredSalary,
      message: args.message,
      yearsExp: args.yearsExp,
      skills: args.skills,
      isBoosted: Boolean(args.boostCents && args.boostCents >= MIN_BOOST_CENTS),
      boostCents: args.boostCents,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all bids for a job, sorted by:
 * 1. Boosted bids first (higher boostCents = higher)
 * 2. Then by salary (lower = more attractive to employer)
 */
export const getBidsForJob = query({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, args) => {
    const bids = await ctx.db
      .query("salaryBids")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();

    // Sort: boosted first (by boost amount desc), then by salary asc (lower is better)
    bids.sort((a, b) => {
      const aBoost = a.isBoosted ? (a.boostCents ?? 0) : 0;
      const bBoost = b.isBoosted ? (b.boostCents ?? 0) : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      return a.desiredSalary - b.desiredSalary;
    });

    return bids;
  },
});

/**
 * Get bid count + top bid summary for multiple jobs (for board display).
 */
export const getBidSummary = query({
  args: {},
  handler: async (ctx) => {
    const allBids = await ctx.db.query("salaryBids").collect();

    // Group by jobId
    const byJob: Record<
      string,
      { count: number; topSalary: number; topUser: string }
    > = {};

    for (const bid of allBids) {
      const jid = bid.jobId;
      if (!byJob[jid]) {
        byJob[jid] = { count: 0, topSalary: Infinity, topUser: "" };
      }
      byJob[jid].count++;
      if (bid.desiredSalary < byJob[jid].topSalary) {
        byJob[jid].topSalary = bid.desiredSalary;
        byJob[jid].topUser = bid.userName;
      }
    }

    return byJob;
  },
});

/**
 * Get the current user's bids.
 */
export const getMyBids = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bids = await ctx.db
      .query("salaryBids")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with job info
    const enriched = await Promise.all(
      bids.map(async (bid) => {
        const job = await ctx.db.get(bid.jobId);
        return { ...bid, job };
      }),
    );

    return enriched;
  },
});

/**
 * Submit a user-created job listing ($2 listing fee).
 */
export const submitJob = mutation({
  args: {
    title: v.string(),
    companyName: v.string(),
    location: v.optional(v.string()),
    isRemote: v.boolean(),
    url: v.string(),
    description: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to list a job.");

    return ctx.db.insert("userJobs", {
      userId,
      ...args,
      totalPaid: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get user-submitted job listings (ranked by totalPaid).
 */
export const getUserJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userJobs")
      .withIndex("by_total_paid")
      .order("desc")
      .take(50);
  },
});
