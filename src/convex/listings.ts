import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import {
  isCategoryId,
  LISTING_FEE_CENTS,
  MAX_BID_CENTS,
  MIN_BID_CENTS,
  REFERRAL_CREDIT_CENTS,
  SABOTAGE_MULTIPLIER,
  STAR_CREDIT_CENTS,
  TOP_SPOT_PREMIUM_CENTS,
} from "../lib/categories";
import { sanitizeUrl } from "../lib/url";

export { LISTING_FEE_CENTS, MAX_BID_CENTS, MIN_BID_CENTS, REFERRAL_CREDIT_CENTS, SABOTAGE_MULTIPLIER, STAR_CREDIT_CENTS, TOP_SPOT_PREMIUM_CENTS };
export const LOCK_MULTIPLIER = 5;
export const LOCK_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export type BoardMode = "all" | "today";

function currentTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function todayScore(l: ListingDoc, key: string) {
  if (l.todayKey !== key) return 0;
  return Math.max(0, (l.todayBoostCents ?? 0) - (l.todaySabotageCents ?? 0));
}

type ListingDoc = {
  _id: string;
  _creationTime: number;
  ownerId: string;
  title: string;
  url: string;
  tagline?: string;
  category: string;
  totalPaid: number;
  boostedCents: number;
  sabotagedCents: number;
  starCount: number;
  boostCount: number;
  dislikeCount: number;
  lockedUntil?: number;
  lastBidAt: number;
  createdAt: number;
  todayKey?: string;
  todayBoostCents?: number;
  todaySabotageCents?: number;
  referralCreditCents?: number;
};

/** Paid money + free credit (stars + referrals) — what actually ranks. */
export function effectiveTotal(l: {
  totalPaid: number;
  starCount: number;
  referralCreditCents?: number;
}): number {
  return (
    l.totalPaid +
    l.starCount * STAR_CREDIT_CENTS +
    (l.referralCreditCents ?? 0)
  );
}

/** Rank listings: "all" by total paid, "today" by today's net. Ties favor
 *  the older entry; an active 5x-lock pins its holder at #1 (all-time only). */
function rankListings(listings: ListingDoc[], now: number, mode: BoardMode = "all") {
  const score = (l: ListingDoc) =>
    mode === "today" ? todayScore(l, currentTodayKey()) : effectiveTotal(l);
  const sorted = [...listings]
    .filter((l) => score(l) > 0)
    .sort((a, b) => score(b) - score(a) || a.createdAt - b.createdAt);
  if (mode !== "today") {
    const locked = sorted.find((l) => (l.lockedUntil ?? 0) > now);
    if (locked && locked !== sorted[0]) {
      return [locked, ...sorted.filter((l) => l !== locked)];
    }
  }
  return sorted;
}

async function buildBoard(
  ctx: QueryCtx,
  category?: string | null,
  mode: BoardMode = "all",
  limit = 100,
) {
  const now = Date.now();
  let rows: ListingDoc[];
  if (category && isCategoryId(category)) {
    rows = await ctx.db
      .query("listings")
      .withIndex("by_category_total", (q) => q.eq("category", category))
      .collect();
  } else {
    rows = await ctx.db.query("listings").collect();
  }
  const ranked = rankListings(rows, now, mode).slice(0, limit);

  const ownerIds = [...new Set(ranked.map((l) => l.ownerId))];
  const owners = new Map<string, string>();
  for (const id of ownerIds) {
    const user = await ctx.db.get(id as Id<"users">);
    if (user) owners.set(id, user.name || user.email?.split("@")[0] || "anon");
  }

  return ranked.map((l, i) => ({
    ...l,
    rank: i + 1,
    isLocked: mode !== "today" && (l.lockedUntil ?? 0) > now,
    ownerName: owners.get(l.ownerId) ?? "anon",
  }));
}

export const getBoard = query({
  args: {
    category: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("all"), v.literal("today"))),
  },
  handler: async (ctx, args) =>
    buildBoard(ctx, args.category, args.mode ?? "all"),
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db.query("listings").collect();
    const active = listings.filter((l) => l.totalPaid > 0);
    return {
      potCents: listings.reduce((s, l) => s + l.boostedCents, 0),
      sabotageCents: listings.reduce((s, l) => s + l.sabotagedCents, 0),
      todayBoostCents: listings.reduce(
        (s, l) => s + (l.todayKey === currentTodayKey() ? l.todayBoostCents ?? 0 : 0),
        0,
      ),
      listingCount: listings.length,
      activeCount: active.length,
      bidCount: listings.reduce((s, l) => s + l.boostCount + l.dislikeCount, 0),
      starCount: listings.reduce((s, l) => s + l.starCount, 0),
    };
  },
});

export const getActivity = query({
  args: {},
  handler: async (ctx) => {
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_created_at", (q) => q.gte("createdAt", 0))
      .order("desc")
      .take(40)
      .then((r) => r.filter((b) => b.status === "paid"));

    const items = [];
    for (const bid of bids.slice(0, 20)) {
      const [listing, user] = await Promise.all([
        ctx.db.get(bid.listingId),
        ctx.db.get(bid.userId),
      ]);
      if (!listing) continue;
      items.push({
        _id: bid._id,
        kind: bid.kind,
        amount: bid.amount,
        createdAt: bid.createdAt,
        listingTitle: listing.title,
        category: listing.category,
        userName: user?.name || user?.email?.split("@")[0] || "anon",
      });
    }
    return items;
  },
});

/** Leader + total for every category, for the category-cards grid. */
export const getCategoryLeaders = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db.query("listings").collect();
    const byCat = new Map<string, ListingDoc[]>();
    for (const l of listings) {
      const arr = byCat.get(l.category) ?? [];
      arr.push(l);
      byCat.set(l.category, arr);
    }
    const leaders: {
      categoryId: string;
      leaderTitle: string | null;
      leaderCents: number;
      leaderUrl: string | null;
      count: number;
    }[] = [];
    for (const [categoryId, rows] of byCat) {
      const top = rankListings(rows, Date.now(), "all")[0];
      leaders.push({
        categoryId,
        leaderTitle: top?.title ?? null,
        leaderCents: top?.totalPaid ?? 0,
        leaderUrl: top?.url ?? null,
        count: rows.length,
      });
    }
    return leaders;
  },
});

/** The signed-in founder's own listings, with live rank + cost to lead. */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const now = Date.now();
    const mine = await ctx.db
      .query("listings")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const all = await ctx.db.query("listings").collect();
    const ranked = rankListings(all.filter((l) => l.totalPaid > 0), now);
    const topTotal = ranked[0]?.totalPaid ?? 0;

    return mine.map((l) => {
      const rank = l.totalPaid > 0 ? ranked.findIndex((r) => r._id === l._id) : -1;
      // outbid.lol: retake = difference + $5 (top spot premium)
      const neededToLead =
        l.totalPaid >= topTotal ? 0 : costToTakeTop(topTotal) - l.totalPaid;
      return {
        ...l,
        rank: rank >= 0 ? rank + 1 : null,
        isLocked: (l.lockedUntil ?? 0) > now,
        isLeading: l.totalPaid > 0 && l.totalPaid >= topTotal,
        minBoostCents: Math.max(MIN_BID_CENTS, neededToLead),
        neededToLead,
      };
    });
  },
});

/** The signed-in founder's recent payments (boosts + dislikes). */
export const getMyBids = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    const items = [];
    for (const bid of bids) {
      const listing = await ctx.db.get(bid.listingId);
      if (!listing) continue;
      items.push({
        _id: bid._id,
        kind: bid.kind,
        amount: bid.amount,
        status: bid.status,
        createdAt: bid.createdAt,
        listingTitle: listing.title,
      });
    }
    return items;
  },
});

/** Full detail for one listing: live rank, retake price, and bid history. */
export const getListingDetail = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return null;
    const now = Date.now();

    // Rank within the listing's own category (all-time board).
    const peers = await ctx.db
      .query("listings")
      .withIndex("by_category_total", (q) => q.eq("category", listing.category))
      .collect();
    const ranked = rankListings(
      peers.filter((l) => l.totalPaid > 0),
      now,
      "all",
    );
    const rank = ranked.findIndex((r) => r._id === listing._id);
    const topTotal = ranked[0]?.totalPaid ?? 0;
    const isLeading = listing.totalPaid > 0 && listing.totalPaid >= topTotal;
    // outbid.lol: retake = difference + $5 (top spot premium).
    const neededToLead =
      isLeading || listing.totalPaid <= 0 ? 0 : costToTakeTop(topTotal) - listing.totalPaid;

    const bids = await ctx.db
      .query("bids")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .order("desc")
      .take(40);

    const history = [];
    for (const b of bids) {
      if (b.status !== "paid") continue;
      const user = await ctx.db.get(b.userId);
      history.push({
        _id: b._id,
        kind: b.kind,
        amount: b.amount,
        createdAt: b.createdAt,
        userName: user?.name || user?.email?.split("@")[0] || "anon",
      });
      if (history.length >= 20) break;
    }

    const owner = await ctx.db.get(listing.ownerId);

    return {
      _id: listing._id,
      title: listing.title,
      url: listing.url,
      tagline: listing.tagline,
      category: listing.category,
      totalPaid: listing.totalPaid,
      starCount: listing.starCount,
      dislikeCount: listing.dislikeCount,
      boostedCents: listing.boostedCents,
      sabotagedCents: listing.sabotagedCents,
      starCreditCents: listing.starCount * STAR_CREDIT_CENTS,
      referralCreditCents: listing.referralCreditCents ?? 0,
      effectiveTotal: effectiveTotal(listing),
      isLocked: (listing.lockedUntil ?? 0) > now,
      ownerName: owner?.name || owner?.email?.split("@")[0] || "anon",
      rank: rank >= 0 ? rank + 1 : null,
      isLeading,
      neededToLead,
      bids: history,
    };
  },
});

/** Listing ids the current user has starred (for star-button state). */
export const getMyStars = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const stars = await ctx.db
      .query("stars")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return stars.map((s) => s.listingId);
  },
});

const TITLE_MAX = 80;
const TAGLINE_MAX = 140;

function validateDraft(
  title: string,
  tagline: string | undefined,
  category: string,
): { url: string } | { error: string } {
  const t = title.trim();
  if (t.length < 2 || t.length > TITLE_MAX) {
    return { error: `Title must be ${2}-${TITLE_MAX} characters.` };
  }
  const tg = tagline?.trim() ?? "";
  if (tg.length > TAGLINE_MAX) {
    return { error: `Tagline must be at most ${TAGLINE_MAX} characters.` };
  }
  if (!isCategoryId(category)) return { error: "Pick a valid board." };
  return { url: "" };
}

/** Pre-checks the draft before the $2 listing fee is charged. */
export const listingFeeGuard = internalMutation({
  args: {
    title: v.string(),
    url: v.string(),
    tagline: v.optional(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to submit a product.");

    const draft = validateDraft(args.title, args.tagline, args.category);
    if ("error" in draft) throw new Error(draft.error);
    const clean = sanitizeUrl(args.url);
    if (!clean.ok) throw new Error(clean.error);

    const dupe = await ctx.db
      .query("listings")
      .withIndex("by_url", (q) => q.eq("url", clean.url))
      .first();
    if (dupe) throw new Error("That link is already on the board.");

    return { ok: true };
  },
});

/** Runs from the payment webhook after the $2 fee clears. Idempotent via
 *  the by_url dupe check — retries never double-list. */
export const createPaidListing = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    url: v.string(),
    tagline: v.optional(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = validateDraft(args.title, args.tagline, args.category);
    if ("error" in draft) throw new Error(draft.error);
    const clean = sanitizeUrl(args.url);
    if (!clean.ok) throw new Error(clean.error);

    const dupe = await ctx.db
      .query("listings")
      .withIndex("by_url", (q) => q.eq("url", clean.url))
      .first();
    if (dupe) return dupe._id; // already created by an earlier webhook retry

    const now = Date.now();
    return ctx.db.insert("listings", {
      ownerId: args.userId as Id<"users">,
      title: args.title.trim(),
      url: clean.url,
      tagline: args.tagline?.trim() || undefined,
      category: args.category,
      totalPaid: 0,
      boostedCents: 0,
      sabotagedCents: 0,
      starCount: 0,
      boostCount: 0,
      dislikeCount: 0,
      todayKey: currentTodayKey(),
      todayBoostCents: 0,
      todaySabotageCents: 0,
      lastBidAt: now,
      createdAt: now,
    });
  },
});

export const toggleStar = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to star products.");
    const existing = await ctx.db
      .query("stars")
      .withIndex("by_listing_user", (q) =>
        q.eq("listingId", args.listingId).eq("userId", userId),
      )
      .first();
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found.");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.listingId, {
        starCount: Math.max(0, listing.starCount - 1),
      });
      return false;
    }
    await ctx.db.insert("stars", {
      listingId: args.listingId,
      userId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.listingId, { starCount: listing.starCount + 1 });
    return true;
  },
});

// ---- internal ----

/** Ownership rules per bid kind; creates the pending bid paid for via Dodo. */
export const checkoutGuard = internalMutation({
  args: {
    listingId: v.id("listings"),
    amountCents: v.number(),
    kind: v.union(v.literal("boost"), v.literal("dislike")),
  },
  handler: async (ctx, args): Promise<{ title: string; bidId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found.");

    if (args.kind === "boost" && listing.ownerId !== userId) {
      throw new Error("You can only boost your own listing.");
    }
    if (args.kind === "dislike" && listing.ownerId === userId) {
      throw new Error("You can't pay to down-rank yourself.");
    }

    const bidId = await ctx.db.insert("bids", {
      listingId: args.listingId,
      userId,
      kind: args.kind,
      amount: args.amountCents,
      resultingTotal: -1, // set when the webhook applies the payment
      status: "pending",
      createdAt: Date.now(),
    });
    return { title: listing.title, bidId };
  },
});

/** Applied by the Dodo Payments webhook after payment confirms. */
export const applyPaidBid = internalMutation({
  args: { bidId: v.id("bids"), paymentId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const bid = await ctx.db.get(args.bidId);
    if (!bid || bid.status === "paid") return;
    const listing = await ctx.db.get(bid.listingId);
    if (!listing) return;

    const now = Date.now();
    const todayKey = currentTodayKey();
    const freshDay = listing.todayKey !== todayKey;
    const prevBoost = freshDay ? 0 : (listing.todayBoostCents ?? 0);
    const prevSab = freshDay ? 0 : (listing.todaySabotageCents ?? 0);

    if (bid.kind === "boost") {
      // Lock rule: a single boost of >= 5x the current top total locks #1.
      const all = await ctx.db.query("listings").collect();
      const ranked = rankListings(all.filter((l) => l.totalPaid > 0), now);
      const topTotal = ranked[0]?.totalPaid ?? 0;
      const locks =
        amountQualifiesForLock(bid.amount, topTotal) &&
        (listing.totalPaid === topTotal ||
          listing.totalPaid + bid.amount > topTotal);

      await ctx.db.patch(listing._id, {
        totalPaid: listing.totalPaid + bid.amount,
        boostedCents: listing.boostedCents + bid.amount,
        boostCount: listing.boostCount + 1,
        lockedUntil: locks ? now + LOCK_DURATION_MS : listing.lockedUntil,
        lastBidAt: now,
        todayKey,
        todayBoostCents: prevBoost + bid.amount,
        todaySabotageCents: prevSab,
      });
    } else {
      // Paid sabotage: drags the target down by the amount paid (floor $0).
      await ctx.db.patch(listing._id, {
        totalPaid: Math.max(0, listing.totalPaid - bid.amount),
        sabotagedCents: listing.sabotagedCents + bid.amount,
        dislikeCount: listing.dislikeCount + 1,
        lastBidAt: now,
        todayKey,
        todayBoostCents: prevBoost,
        todaySabotageCents: prevSab + bid.amount,
      });
    }

    await ctx.db.patch(bid._id, {
      status: "paid",
      ...(args.paymentId ? { dodoPaymentId: args.paymentId } : {}),
    });
  },
});

function amountQualifiesForLock(amountCents: number, topTotalCents: number) {
  return topTotalCents > 0 && amountCents >= LOCK_MULTIPLIER * topTotalCents;
}

/** outbid.lol rule: taking #1 requires $5 more than the current leader. */
function costToTakeTop(currentLeaderCents: number): number {
  return currentLeaderCents + TOP_SPOT_PREMIUM_CENTS;
}
