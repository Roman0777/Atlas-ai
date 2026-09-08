import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCategory } from "../lib/categories";

// ── Constants ────────────────────────────────────────────────────────────────
export const INTRO_COST_CREDITS = 25;
export const INTRO_MESSAGE_MAX = 500;

export const DEAL_STAGES = ["pre-seed", "seed", "series-a", "series-b", "growth"];

export const INVESTOR_TYPES = ["vc", "angel", "incubator", "accelerator"];

export const TICKET_TYPES = ["equity", "safe", "grant", "program"];

/** Right-leaning list: stages by index, for adjacency scoring. */
function stageIndex(stage: string): number {
  const i = DEAL_STAGES.indexOf(stage);
  return i === -1 ? DEAL_STAGES.length + 1 : i;
}

/**
 * Transparent, explainable match score (0–100):
 *  - 40 sector  + 30 stage + 30 check-size fit.
 */
export function matchScore(
  startup: { sector: string; stage: string; askAmount?: number },
  investor: {
    sectors: string[];
    stages: string[];
    checkMin?: number;
    checkMax?: number;
  },
): number {
  let score = 0;
  if (investor.sectors.includes(startup.sector)) score += 40;
  const si = stageIndex(startup.stage);
  if (investor.stages.includes(startup.stage)) {
    score += 30;
  } else if (investor.stages.some((s) => Math.abs(stageIndex(s) - si) === 1)) {
    score += 15;
  }
  const ask = startup.askAmount ?? 0;
  const lo = investor.checkMin ?? 0;
  const hi = investor.checkMax ?? Number.POSITIVE_INFINITY;
  if (hi === Number.POSITIVE_INFINITY) {
    if (ask >= lo || ask === 0) score += 30;
  } else if (ask >= lo && ask <= hi) {
    score += 30;
  } else if (ask > 0 && ask >= lo * 0.5 && ask <= hi * 1.5) {
    score += 15; // close to the range
  }
  return score;
}

// ── Profile upserts (one profile of each kind per user) ─────────────────────

export const upsertInvestorProfile = mutation({
  args: {
    orgName: v.string(),
    type: v.union(
      v.literal("vc"),
      v.literal("angel"),
      v.literal("incubator"),
      v.literal("accelerator"),
    ),
    thesis: v.string(),
    stages: v.array(v.string()),
    sectors: v.array(v.string()),
    checkMin: v.optional(v.number()),
    checkMax: v.optional(v.number()),
    ticketType: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    portfolioCount: v.optional(v.number()),
    isOpenToDeals: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const name = args.orgName.trim();
    const thesis = args.thesis.trim();
    if (name.length < 2) throw new Error("Organization name is required.");
    if (thesis.length < 10) throw new Error("Thesis needs at least 10 characters.");
    if (args.stages.length === 0) throw new Error("Pick at least one stage.");
    if (args.sectors.length === 0) throw new Error("Pick at least one sector.");
    if (
      args.checkMin !== undefined &&
      args.checkMax !== undefined &&
      args.checkMax < args.checkMin
    ) {
      throw new Error("Max check can't be below min check.");
    }
    const existing = await ctx.db
      .query("investorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const doc = {
      orgName: name,
      type: args.type,
      thesis,
      stages: args.stages,
      sectors: args.sectors,
      checkMin: args.checkMin,
      checkMax: args.checkMax,
      ticketType: args.ticketType,
      website: args.website?.trim() || undefined,
      logoUrl: args.logoUrl?.trim() || undefined,
      portfolioCount: args.portfolioCount,
      isOpenToDeals: args.isOpenToDeals ?? true,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { _id: existing._id as string, updated: true };
    }
    const _id = await ctx.db.insert("investorProfiles", {
      userId,
      ...doc,
    });
    return { _id: _id as string, updated: false };
  },
});

export const upsertStartupProfile = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    sector: v.string(),
    stage: v.string(),
    askAmount: v.optional(v.number()),
    valuationHint: v.optional(v.number()),
    deckUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    traction: v.optional(v.string()),
    teamSize: v.optional(v.number()),
    foundedYear: v.optional(v.number()),
    elevatorPitch: v.optional(v.string()),
    isRaising: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const name = args.name.trim();
    const tagline = args.tagline.trim();
    if (name.length < 2) throw new Error("Startup name is required.");
    if (tagline.length < 5) throw new Error("Tagline needs at least 5 characters.");
    if (!DEAL_STAGES.includes(args.stage)) {
      throw new Error("Unknown stage.");
    }
    if (!getCategory(args.sector)) throw new Error("Unknown sector.");

    const existing = await ctx.db
      .query("startupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const doc = {
      name,
      tagline,
      sector: args.sector,
      stage: args.stage,
      askAmount: args.askAmount,
      valuationHint: args.valuationHint,
      deckUrl: args.deckUrl?.trim() || undefined,
      website: args.website?.trim() || undefined,
      traction: args.traction?.trim() || undefined,
      teamSize: args.teamSize,
      foundedYear: args.foundedYear,
      elevatorPitch: args.elevatorPitch?.trim() || undefined,
      isRaising: args.isRaising ?? true,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { _id: existing._id as string, updated: true };
    }
    const _id = await ctx.db.insert("startupProfiles", { userId, ...doc });
    return { _id: _id as string, updated: false };
  },
});

// ── Directory queries ────────────────────────────────────────────────────────

/** All investor profiles (optionally filtered). */
export const listInvestors = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("vc"),
        v.literal("angel"),
        v.literal("incubator"),
        v.literal("accelerator"),
      ),
    ),
    stage: v.optional(v.string()),
    sector: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db.query("investorProfiles").collect();
    if (args.type) rows = rows.filter((r) => r.type === args.type);
    if (args.stage) rows = rows.filter((r) => r.stages.includes(args.stage!));
    if (args.sector) rows = rows.filter((r) => r.sectors.includes(args.sector!));
    rows = rows.filter((r) => r.isOpenToDeals !== false);
    rows.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    const ownerIds = [...new Set(rows.map((r) => r.userId))];
    const nameOf = new Map<string, string>();
    for (const id of ownerIds) {
      const u = await ctx.db.get(id);
      if (u) nameOf.set(id, u.name ?? u.email?.split("@")[0] ?? "Member");
    }
    return rows.slice(0, 100).map((r) => ({
      _id: r._id,
      ownerName: nameOf.get(r.userId) ?? "Member",
      orgName: r.orgName,
      type: r.type,
      thesis: r.thesis,
      stages: r.stages,
      sectors: r.sectors,
      checkMin: r.checkMin,
      checkMax: r.checkMax,
      ticketType: r.ticketType,
      website: r.website,
      logoUrl: r.logoUrl,
      portfolioCount: r.portfolioCount,
      verified: r.verified ?? false,
      createdAt: r.createdAt,
    }));
  },
});

/** All startup profiles (optionally filtered). */
export const listStartups = query({
  args: {
    stage: v.optional(v.string()),
    sector: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db.query("startupProfiles").collect();
    if (args.stage) rows = rows.filter((r) => r.stage === args.stage);
    if (args.sector) rows = rows.filter((r) => r.sector === args.sector);
    rows = rows.filter((r) => r.isRaising !== false);
    rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const ownerIds = [...new Set(rows.map((r) => r.userId))];
    const nameOf = new Map<string, string>();
    for (const id of ownerIds) {
      const u = await ctx.db.get(id);
      if (u) nameOf.set(id, u.name ?? u.email?.split("@")[0] ?? "Member");
    }
    return rows.slice(0, 100).map((r) => ({
      _id: r._id,
      ownerName: nameOf.get(r.userId) ?? "Member",
      name: r.name,
      tagline: r.tagline,
      sector: r.sector,
      stage: r.stage,
      askAmount: r.askAmount,
      valuationHint: r.valuationHint,
      deckUrl: r.deckUrl,
      website: r.website,
      traction: r.traction,
      teamSize: r.teamSize,
      foundedYear: r.foundedYear,
      elevatorPitch: r.elevatorPitch,
      createdAt: r.createdAt,
    }));
  },
});

/** The signed-in user's own profiles (null if none yet). */
export const getMyProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { investor: null, startup: null };
    const investor = await ctx.db
      .query("investorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const startup = await ctx.db
      .query("startupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return {
      investor: investor ?? null,
      startup: startup ?? null,
    };
  },
});

// ── Intros & bookmarks ───────────────────────────────────────────────────────

/** Founder → investor intro, charged credits from the sender's wallet. */
export const sendIntro = mutation({
  args: {
    startupId: v.id("startupProfiles"),
    investorId: v.id("investorProfiles"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");

    const startup = await ctx.db.get(args.startupId);
    if (!startup) throw new Error("Startup not found.");
    const investor = await ctx.db.get(args.investorId);
    if (!investor) throw new Error("Investor profile not found.");

    const message = args.message.trim();
    if (message.length < 10) {
      throw new Error("Message needs at least 10 characters.");
    }
    if (message.length > INTRO_MESSAGE_MAX) {
      throw new Error(`Message max ${INTRO_MESSAGE_MAX} characters.`);
    }

    const myStartup = await ctx.db
      .query("startupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const myInvestor = await ctx.db
      .query("investorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const allowed =
      (myStartup && myStartup._id === args.startupId) ||
      (myInvestor && myInvestor._id === args.investorId);
    if (!allowed) {
      throw new Error("You must be part of this deal to send an intro.");
    }

    // Charge credits only when the startup owner initiates to an outside firm.
    const isOwnerOfStartup = myStartup && myStartup._id === args.startupId;
    const creditsCharged = isOwnerOfStartup ? INTRO_COST_CREDITS : 0;

    const dup = await ctx.db
      .query("introRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    if (
      dup.some(
        (d) => d.startupId === args.startupId && d.investorId === args.investorId,
      )
    ) {
      throw new Error("An intro between these two is already pending.");
    }

    if (creditsCharged > 0) {
      await ctx.runMutation(internal.credits.spendCredits, {
        userId,
        amount: creditsCharged,
        kind: "intro",
        description: `Intro: ${startup.name} → ${investor.orgName}`,
      });
    }

    const _id = await ctx.db.insert("introRequests", {
      startupId: args.startupId,
      investorId: args.investorId,
      fromStartup: !!isOwnerOfStartup,
      message,
      status: "pending",
      creditsCharged,
      createdAt: Date.now(),
    });
    return { _id, creditsCharged };
  },
});

/** Accept or decline a pending intro received on one of your profiles. */
export const respondToIntro = mutation({
  args: {
    introId: v.id("introRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const intro = await ctx.db.get(args.introId);
    if (!intro) throw new Error("Intro not found.");
    if (intro.status !== "pending") {
      throw new Error("This intro was already answered.");
    }
    const startup = await ctx.db.get(intro.startupId);
    const investor = await ctx.db.get(intro.investorId);
    const isFounder = startup?.userId === userId;
    const isInvestor = investor?.userId === userId;
    if (!isFounder && !isInvestor) {
      throw new Error("Only deal participants can respond.");
    }
    await ctx.db.patch(args.introId, {
      status: args.accept ? "accepted" : "declined",
      respondedAt: Date.now(),
    });
    return { status: args.accept ? "accepted" : "declined" };
  },
});

/** Toggle a bookmark (investor saves a startup). */
export const saveStartup = mutation({
  args: { startupId: v.id("startupProfiles"), saved: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const existing = await ctx.db
      .query("savedStartups")
      .withIndex("by_investor", (q) => q.eq("investorId", userId))
      .collect();
    const found = existing.find((s) => s.startupId === args.startupId);
    if (args.saved && !found) {
      await ctx.db.insert("savedStartups", {
        investorId: userId,
        startupId: args.startupId,
        createdAt: Date.now(),
      });
    } else if (!args.saved && found) {
      await ctx.db.delete(found._id);
    }
    return { saved: args.saved };
  },
});

/** Intro requests involving the signed-in user, with counterparty names. */
export const myIntros = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const myStartup = await ctx.db
      .query("startupProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const myInvestor = await ctx.db
      .query("investorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!myStartup && !myInvestor) return [];

    const rows = await ctx.db.query("introRequests").collect();
    const mine = rows.filter(
      (r) =>
        (myStartup && r.startupId === myStartup._id) ||
        (myInvestor && r.investorId === myInvestor._id),
    );
    const out: Array<{
      id: Id<"introRequests">;
      status: string;
      fromStartup: boolean;
      message: string;
      creditsCharged: number;
      createdAt: number;
      counterpartyName: string;
      isInbound: boolean;
    }> = [];
    for (const r of mine.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))) {
      const startup = await ctx.db.get(r.startupId);
      const investor = await ctx.db.get(r.investorId);
      const isInbound = Boolean(
        (myStartup && r.startupId === myStartup._id && !r.fromStartup) ||
          (myInvestor && r.investorId === myInvestor._id && r.fromStartup),
      );
      out.push({
        id: r._id,
        status: r.status,
        fromStartup: r.fromStartup,
        message: r.message,
        creditsCharged: r.creditsCharged,
        createdAt: r.createdAt,
        counterpartyName:
          r.fromStartup
            ? investor?.orgName ?? "Investor"
            : startup?.name ?? "Startup",
        isInbound,
      });
    }
    return out;
  },
});

/** For a signed-in user: shown profile other-direction matches, sorted by score. */
export const matchesFor = query({
  args: {
    kind: v.union(v.literal("investors"), v.literal("startups")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (args.kind === "investors") {
      const myStartup = await ctx.db
        .query("startupProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (!myStartup) return [];
      const all = (
        await ctx.db.query("investorProfiles").collect()
      ).filter((r) => r.isOpenToDeals !== false);
      const scored = all
        .map((r) => ({
          _id: r._id,
          orgName: r.orgName,
          type: r.type,
          verified: r.verified ?? false,
          checkMin: r.checkMin,
          checkMax: r.checkMax,
          stages: r.stages,
          sectors: r.sectors,
          match: matchScore(
            {
              sector: myStartup.sector,
              stage: myStartup.stage,
              askAmount: myStartup.askAmount,
            },
            r,
          ),
        }))
        .sort((a, b) => b.match - a.match);
      return scored.slice(0, 50);
    }
    const myInvestor = await ctx.db
      .query("investorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!myInvestor) return [];
    const all = (
      await ctx.db.query("startupProfiles").collect()
    ).filter((r) => r.isRaising !== false);
    return all
      .map((r) => ({
        _id: r._id,
        name: r.name,
        tagline: r.tagline,
        stage: r.stage,
        sector: r.sector,
        askAmount: r.askAmount,
        match: matchScore(r, myInvestor),
      }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 50);
  },
});