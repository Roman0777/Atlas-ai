import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server";

// Demo content so a fresh deployment doesn't show empty boards.
// No-ops once any listing exists.

const HOUR = 60 * 60 * 1000;

type SeedListing = {
  owner: string;
  title: string;
  url: string;
  tagline: string;
  category: string;
  totalPaid: number; // dollars
  boostedCents?: number;
  sabotagedCents?: number;
  starCount: number;
  dislikeCount?: number;
};

const SEED_OWNERS = [
  { key: "maya", name: "Maya" },
  { key: "dev", name: "devrahul" },
  { key: "sam", name: "Sam K" },
  { key: "linh", name: "linh.builds" },
];

const SEED_LISTINGS: SeedListing[] = [
  // AI Tools
  { owner: "maya", title: "Nebula Copilot", url: "https://nebula-copilot.dev", tagline: "Your codebase, but it answers back.", category: "ai-tools", totalPaid: 4120, boostedCents: 412000, starCount: 318 },
  { owner: "dev", title: "PromptForge", url: "https://promptforge.ai", tagline: "Version control for prompts your team actually reuses.", category: "ai-tools", totalPaid: 2340, boostedCents: 234000, sabotagedCents: 15000, starCount: 141, dislikeCount: 15 },
  { owner: "sam", title: "MeetingZero", url: "https://meetingzero.app", tagline: "AI that kills the meeting before it happens.", category: "ai-tools", totalPaid: 980, boostedCents: 98000, starCount: 87 },
  // SaaS
  { owner: "sam", title: "Shipfast.dev", url: "https://shipfast.dev", tagline: "From idea to paying users in a weekend.", category: "saas", totalPaid: 2860, boostedCents: 286000, sabotagedCents: 5000, starCount: 204, dislikeCount: 5 },
  { owner: "linh", title: "ChurnRadar", url: "https://churnradar.io", tagline: "Know who's leaving before they do.", category: "saas", totalPaid: 1450, boostedCents: 145000, starCount: 96 },
  // Extensions
  { owner: "dev", title: "TabWrangler", url: "https://tabwrangler.com", tagline: "200 open tabs? Not anymore.", category: "extensions", totalPaid: 1930, boostedCents: 193000, starCount: 267 },
  { owner: "maya", title: "DarkReader+", url: "https://darkreader.plus", tagline: "The dark mode the whole web deserves.", category: "extensions", totalPaid: 720, boostedCents: 72000, starCount: 412 },
  // MCP
  { owner: "linh", title: "MCP Postgres Bridge", url: "https://github.com/linh/mcp-postgres", tagline: "Let your agent query prod. Carefully.", category: "mcp", totalPaid: 1180, boostedCents: 118000, starCount: 158 },
  { owner: "sam", title: "Filesystem MCP", url: "https://github.com/sam/fs-mcp", tagline: "Give every model safe local file access.", category: "mcp", totalPaid: 640, boostedCents: 64000, starCount: 221 },
  // OSS
  { owner: "dev", title: "crabcache", url: "https://github.com/dev/crabcache", tagline: "A build cache in Rust that pays rent.", category: "oss", totalPaid: 890, boostedCents: 89000, starCount: 341 },
  { owner: "maya", title: "tinyqueue", url: "https://github.com/maya/tinyqueue", tagline: "A job queue in 400 lines of TypeScript.", category: "oss", totalPaid: 430, boostedCents: 43000, starCount: 189 },
  // Crypto
  { owner: "linh", title: "$GRIND", url: "https://grindcoin.wtf", tagline: "The token for people who ship.", category: "crypto", totalPaid: 3320, boostedCents: 332000, sabotagedCents: 42000, starCount: 509, dislikeCount: 42 },
  { owner: "sam", title: "LedgerLark", url: "https://ledgerlark.xyz", tagline: "On-chain analytics for normal humans.", category: "crypto", totalPaid: 1560, boostedCents: 156000, starCount: 77 },
  // Papers
  { owner: "maya", title: "Attention Is All You Need (Again)", url: "https://arxiv.org/abs/2401.00001", tagline: "We reran it. It still works. Shocking.", category: "papers", totalPaid: 610, boostedCents: 61000, starCount: 233 },
  { owner: "dev", title: "Scaling Laws for Vibes", url: "https://arxiv.org/abs/2402.00002", tagline: "Empirical evidence that vibes scale log-linearly.", category: "papers", totalPaid: 350, boostedCents: 35000, starCount: 128 },
  // Social media profiles
  { owner: "maya", title: "@mayabuilds", url: "https://x.com/mayabuilds", tagline: "Ship fast, ship often. AI + indie hacker.", category: "x-profiles", totalPaid: 2150, boostedCents: 215000, starCount: 342 },
  { owner: "sam", title: "@samkbuilt", url: "https://x.com/samkbuilt", tagline: "Building in public. Daily updates on what I'm making.", category: "x-profiles", totalPaid: 1780, boostedCents: 178000, sabotagedCents: 12000, starCount: 198, dislikeCount: 12 },
  { owner: "linh", title: "linh.builds", url: "https://youtube.com/@linhbuilds", tagline: "Code, design, and the builder lifestyle.", category: "yt-channels", totalPaid: 1920, boostedCents: 192000, starCount: 276 },
  { owner: "dev", title: "DevRahul Vlogs", url: "https://youtube.com/@devrahul", tagline: "From zero to SaaS: the real journey.", category: "yt-channels", totalPaid: 1340, boostedCents: 134000, starCount: 165 },
  { owner: "maya", title: "maya.creates", url: "https://instagram.com/maya.creates", tagline: "Design, travel, and building things.", category: "instagram", totalPaid: 1560, boostedCents: 156000, starCount: 421 },
  { owner: "sam", title: "@samkbuilt", url: "https://tiktok.com/@samkbuilt", tagline: "60-second builds that actually ship.", category: "tiktok", totalPaid: 980, boostedCents: 98000, starCount: 534 },
  { owner: "linh", title: "Linh Nguyen", url: "https://linkedin.com/in/linhnguyen", tagline: "Engineering leader. Open source advocate.", category: "linkedin", totalPaid: 870, boostedCents: 87000, starCount: 89 },
  { owner: "dev", title: "devrahul live", url: "https://twitch.tv/devrahul", tagline: "Late night coding streams. Coffee required.", category: "twitch", totalPaid: 640, boostedCents: 64000, starCount: 143 },
  { owner: "maya", title: "Ship Log", url: "https://shiplog.substack.com", tagline: "Weekly essays on building, shipping, and finding users.", category: "newsletters", totalPaid: 520, boostedCents: 52000, starCount: 201 },
];

/** Idempotent demo seed: inserts owners, listings and some paid bid history. */
export const seedDemo = internalMutation({
  args: {},
  returns: v.null(),
  handler: seedHandler,
});

/** Public wrapper so the client can kick off seeding on first visit. */
export const ensureSeed = mutation({
  args: {},
  returns: v.null(),
  handler: seedHandler,
});

async function seedHandler(ctx: MutationCtx): Promise<null> {
  const existing = await ctx.db.query("listings").first();
  if (existing) return null;

  {
    const now = Date.now();

    const ownerIds = new Map<string, Id<"users">>();
    for (const o of SEED_OWNERS) {
      const id = await ctx.db.insert("users", { name: o.name });
      ownerIds.set(o.key, id);
    }

    const created: { id: Id<"listings">; seed: SeedListing }[] = [];
    let offsetMinutes = SEED_LISTINGS.length * 37;
    let idx = 0;
    for (const seed of SEED_LISTINGS) {
      const createdAt = now - offsetMinutes * 60 * 1000;
      offsetMinutes -= 37;
      const id = await ctx.db.insert("listings", {
        ownerId: ownerIds.get(seed.owner)!,
        title: seed.title,
        url: seed.url,
        tagline: seed.tagline,
        category: seed.category,
        totalPaid: seed.totalPaid * 100,
        boostedCents: (seed.boostedCents ?? seed.totalPaid * 100),
        sabotagedCents: seed.sabotagedCents ?? 0,
        starCount: seed.starCount,
        boostCount: Math.max(1, Math.round((seed.boostedCents ?? seed.totalPaid * 100) / 25000)),
        dislikeCount: seed.dislikeCount ?? 0,
        todayKey: new Date().toISOString().slice(0, 10),
        todayBoostCents:
          idx < 6 ? Math.round(seed.totalPaid * 100 * 0.12) : 0,
        todaySabotageCents: 0,
        lastBidAt: createdAt + HOUR,
        createdAt,
      });
      created.push({ id, seed });
      idx++;
    }

    // Recent paid bids so the live feed has motion.
    const feed: { idx: number; kind: "boost" | "dislike"; amount: number; minutesAgo: number; by: string }[] = [
      { idx: 0, kind: "boost", amount: 50000, minutesAgo: 3, by: "maya" },
      { idx: 11, kind: "dislike", amount: 12000, minutesAgo: 7, by: "sam" },
      { idx: 4, kind: "boost", amount: 30000, minutesAgo: 12, by: "linh" },
      { idx: 11, kind: "boost", amount: 100000, minutesAgo: 18, by: "linh" },
      { idx: 5, kind: "boost", amount: 8000, minutesAgo: 24, by: "dev" },
      { idx: 1, kind: "dislike", amount: 6000, minutesAgo: 31, by: "maya" },
      { idx: 3, kind: "boost", amount: 25000, minutesAgo: 39, by: "sam" },
    ];
    for (const f of feed) {
      const target = created[f.idx];
      await ctx.db.insert("bids", {
        listingId: target.id,
        userId: ownerIds.get(f.by)!,
        kind: f.kind,
        amount: f.amount,
        resultingTotal: target.seed.totalPaid * 100,
        status: "paid",
        createdAt: now - f.minutesAgo * 60 * 1000,
      });
    }

    return null;
  }
}
