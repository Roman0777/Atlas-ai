import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const subscriptionPlanValidator = v.union(
  v.literal("premium"),
  v.literal("pro"),
);
export type SubscriptionPlan = Infer<typeof subscriptionPlanValidator>;

export const subscriptionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("on_hold"),
  v.literal("cancelled"),
  v.literal("expired"),
  v.literal("failed"),
);
export type SubscriptionStatus = Infer<typeof subscriptionStatusValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      subscriptionPlan: v.optional(subscriptionPlanValidator),
      subscriptionStatus: v.optional(subscriptionStatusValidator),
      dodoCustomerId: v.optional(v.string()),
      dodoSubscriptionId: v.optional(v.string()),
      subscriptionCurrentPeriodEnd: v.optional(v.number()),
      subscriptionUpdatedAt: v.optional(v.number()),
      referralCode: v.optional(v.string()),
      referralCount: v.optional(v.number()),

      // Credit wallet: cached balance (1 credit = $0.01 of rank power).
      // creditLedger is the append-only source of truth; this field is
      // patched atomically in the same transaction as every ledger write.
      creditBalance: v.optional(v.number()),
      signupBonusAt: v.optional(v.number()),
    })
      .index("email", ["email"])
      .index("by_referral_code", ["referralCode"]),

    // Pay-to-rank leaderboard: listings compete by total money paid.
    listings: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      url: v.string(),
      tagline: v.optional(v.string()),
      category: v.string(), // one of CATEGORIES from lib/categories.ts
      totalPaid: v.number(), // cents, boosts paid minus sabotage applied (floor 0)
      boostedCents: v.number(), // cents of pure boosts, for stats
      sabotagedCents: v.number(), // cents of dislikes received
      starCount: v.number(), // free likes (engagement signal)
      boostCount: v.number(),
      dislikeCount: v.number(),
      lockedUntil: v.optional(v.number()), // 5x-lock immunity window (ms epoch)
      lastBidAt: v.number(),
      createdAt: v.number(),

      // "Today" leaderboard tracking (resets when the UTC day rolls over)
      todayKey: v.optional(v.string()), // e.g. "2026-08-26"
      todayBoostCents: v.number(),
      todaySabotageCents: v.number(),

      // Free rank credit earned via referrals (cents). Stars credit is
      // computed from starCount — see STAR_CREDIT_CENTS in listings.ts.
      referralCreditCents: v.optional(v.number()),

      // Featured listing: paid highlight with badge + priority display.
      featured: v.optional(v.boolean()),
      featuredUntil: v.optional(v.number()), // ms epoch when featured expires
    })
      .index("by_total_paid", ["totalPaid"])
      .index("by_category_total", ["category", "totalPaid"])
      .index("by_owner", ["ownerId"])
      .index("by_url", ["url"]),

    // Individual payments. "boost" raises your own listing; "dislike" is paid
    // sabotage that drags someone else's listing down the rank.
    bids: defineTable({
      listingId: v.id("listings"),
      userId: v.id("users"),
      kind: v.union(v.literal("boost"), v.literal("dislike")),
      amount: v.number(), // cents paid in this transaction
      resultingTotal: v.number(), // listing totalPaid after this payment applies
      status: v.union(v.literal("pending"), v.literal("paid")),
      dodoPaymentId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_listing", ["listingId"])
      .index("by_user", ["userId"])
      .index("by_session", ["dodoPaymentId"])
      .index("by_created_at", ["createdAt"]),

    // Free engagement: one star per user per listing.
    stars: defineTable({
      listingId: v.id("listings"),
      userId: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_listing_user", ["listingId", "userId"])
      .index("by_user", ["userId"]),

    // Referral program: who invited whom (one referral per new user).
    referrals: defineTable({
      referrerId: v.id("users"),
      referredId: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_referrer", ["referrerId"])
      .index("by_referred", ["referredId"]),

    // Visitor heartbeat: powers the "N online · M visitors since launch" badge.
    visits: defineTable({
      sessionId: v.string(),
      firstSeenAt: v.number(),
      lastSeenAt: v.number(),
    })
      .index("by_session", ["sessionId"])
      .index("by_last_seen", ["lastSeenAt"]),

    // Aggregated job listings from multiple sources (JSearch, Remotive, Arbeitnow).
    jobListings: defineTable({
      source: v.string(), // "jsearch" | "remotive" | "arbeitnow"
      externalId: v.string(), // dedupe key per source
      title: v.string(),
      companyName: v.string(),
      location: v.optional(v.string()),
      isRemote: v.boolean(),
      url: v.string(), // apply link
      description: v.optional(v.string()),
      salaryMin: v.optional(v.number()), // annual USD
      salaryMax: v.optional(v.number()),
      category: v.optional(v.string()), // tech, design, marketing, etc.
      tags: v.optional(v.array(v.string())),
      postedAt: v.optional(v.number()), // when the job was posted
      fetchedAt: v.number(), // when we last fetched it
    })
      .index("by_source_external", ["source", "externalId"])
      .index("by_fetched_at", ["fetchedAt"])
      .index("by_category", ["category"]),

    // Tracks when jobs were last refreshed so the UI can show staleness.
    jobSyncMeta: defineTable({
      source: v.string(),
      lastSyncAt: v.number(),
      jobCount: v.number(),
    })
      .index("by_source", ["source"]),

    // Salary bidding: candidates bid their desired salary for positions.
    // Highest bidder (lowest salary) wins the employer's attention.
    salaryBids: defineTable({
      jobId: v.id("jobListings"), // which job this bid is for
      userId: v.id("users"), // the candidate making the bid
      userName: v.string(), // display name
      desiredSalary: v.number(), // annual USD the candidate wants
      message: v.optional(v.string()), // short pitch to employer
      yearsExp: v.optional(v.number()), // years of experience
      skills: v.optional(v.array(v.string())), // key skills
      isBoosted: v.optional(v.boolean()), // paid boost to rank higher
      boostCents: v.optional(v.number()), // cents paid for boost
      createdAt: v.number(),
    })
      .index("by_job", ["jobId"])
      .index("by_job_salary", ["jobId", "desiredSalary"])
      .index("by_user", ["userId"]),

    // User-submitted job listings (for $2 listing fee)
    userJobs: defineTable({
      userId: v.id("users"),
      title: v.string(),
      companyName: v.string(),
      location: v.optional(v.string()),
      isRemote: v.boolean(),
      url: v.string(), // application link
      description: v.optional(v.string()),
      salaryMin: v.optional(v.number()), // budget floor
      salaryMax: v.optional(v.number()), // budget ceiling
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      totalPaid: v.number(), // cents paid for listing + boosts
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_total_paid", ["totalPaid"]),

    // Credit wallet ledger: append-only source of truth for every credit
    // movement (earn / spend / renew / transfer / AI usage). The balance is
    // cached on users.creditBalance, patched atomically with each insert.
    creditLedger: defineTable({
      userId: v.id("users"),
      amount: v.number(), // signed: positive = earned, negative = spent
      kind: v.union(
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
      ),
      balanceAfter: v.number(), // cached balance after this entry applied
      description: v.optional(v.string()),
      counterpartyId: v.optional(v.id("users")), // transfers
      listingId: v.optional(v.id("listings")), // credit-funded bids
      jobId: v.optional(v.id("jobListings")), // salary-bid boosts
      model: v.optional(v.string()), // ai_usage: model slug
      tokensIn: v.optional(v.number()), // ai_usage
      tokensOut: v.optional(v.number()), // ai_usage
      requestId: v.optional(v.string()), // idempotency key
      createdAt: v.number(),
    })
      .index("by_user_time", ["userId", "createdAt"])
      .index("by_request_id", ["requestId"]),

    // Daily renewal (claim) tracking — one row per user.
    creditDaily: defineTable({
      userId: v.id("users"),
      lastClaimDay: v.optional(v.string()), // UTC "YYYY-MM-DD"
      lastClaimAt: v.optional(v.number()),
      streak: v.number(),
    }).index("by_user", ["userId"]),

    // Deal Room: investor profiles (VC / angel / incubator / accelerator).
    investorProfiles: defineTable({
      userId: v.id("users"),
      orgName: v.string(),
      type: v.union(
        v.literal("vc"),
        v.literal("angel"),
        v.literal("incubator"),
        v.literal("accelerator"),
      ),
      thesis: v.string(),
      stages: v.array(v.string()), // e.g. ["pre-seed","seed"]
      sectors: v.array(v.string()), // CATEGORY ids
      checkMin: v.optional(v.number()), // USD
      checkMax: v.optional(v.number()), // USD
      ticketType: v.optional(v.string()), // equity | safe | grant | program
      website: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      portfolioCount: v.optional(v.number()),
      isOpenToDeals: v.optional(v.boolean()),
      verified: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_type", ["type"])
      .index("by_sector", ["sectors"])
      .index("by_stage", ["stages"]),

    // Deal Room: startup profiles.
    startupProfiles: defineTable({
      userId: v.id("users"),
      name: v.string(),
      tagline: v.string(),
      sector: v.string(), // CATEGORY id
      stage: v.string(), // pre-seed | seed | series-a | series-b | growth
      askAmount: v.optional(v.number()), // USD
      valuationHint: v.optional(v.number()), // USD
      deckUrl: v.optional(v.string()),
      website: v.optional(v.string()),
      traction: v.optional(v.string()), // freeform metrics
      teamSize: v.optional(v.number()),
      foundedYear: v.optional(v.number()),
      elevatorPitch: v.optional(v.string()),
      isRaising: v.optional(v.boolean()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_sector_stage", ["sector", "stage"])
      .index("by_stage", ["stage"]),

    // Deal Room: intro requests (startup <-> investor), credits-charged.
    introRequests: defineTable({
      startupId: v.id("startupProfiles"),
      investorId: v.id("investorProfiles"),
      fromStartup: v.boolean(), // true = founder -> investor
      message: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("expired"),
      ),
      creditsCharged: v.number(),
      createdAt: v.number(),
      respondedAt: v.optional(v.number()),
    })
      .index("by_startup", ["startupId"])
      .index("by_investor", ["investorId"])
      .index("by_status", ["status"]),

    // Deal Room: investor bookmarks of startups.
    savedStartups: defineTable({
      investorId: v.id("users"),
      startupId: v.id("startupProfiles"),
      createdAt: v.number(),
    })
      .index("by_investor", ["investorId"])
      .index("by_startup", ["startupId"]),

    // The Atlas Dispatch: normalized stories pulled from publisher feeds.
    // One row per (sourceKey, externalId) — externalId is the feed's GUID
    // or a content hash fallback. Old rows are pruned after 90 days.
    newsItems: defineTable({
      sourceKey: v.string(), // key in src/lib/news-sources.ts
      sourceName: v.string(), // publisher display name
      sourceUrl: v.string(), // publisher homepage (attribution)
      category: v.string(), // CATEGORY id from lib/categories.ts
      externalId: v.string(), // feed GUID / id / content hash
      title: v.string(),
      url: v.string(),
      summary: v.optional(v.string()),
      author: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      publishedAt: v.number(), // ms epoch
      fetchedAt: v.number(),
    })
      .index("by_source_external", ["sourceKey", "externalId"])
      .index("by_published", ["publishedAt"])
      .index("by_category_published", ["category", "publishedAt"]),

    // Per-source sync bookkeeping for the Dispatch.
    newsSyncMeta: defineTable({
      sourceKey: v.string(),
      lastSyncAt: v.number(),
      status: v.string(), // ok | error
      itemsAdded: v.number(),
      itemCount: v.number(),
      error: v.optional(v.string()),
    }).index("by_source", ["sourceKey"]),

    // Dispatch digest subscribers (double opt-in via Resend).
    newsletterSubscribers: defineTable({
      email: v.string(),
      subscribedAt: v.number(),
      confirmed: v.boolean(),
      confirmToken: v.optional(v.string()),
      confirmSentAt: v.optional(v.number()),
    }).index("by_email", ["email"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
