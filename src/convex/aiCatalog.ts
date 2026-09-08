import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// ── AI economy constants ─────────────────────────────────────────────────────
/** Retail margin over OpenRouter's raw token price. */
export const AI_MARGIN = 1.5;
/** Minimum charge per AI run, in credits. */
export const AI_MIN_CHARGE = 1;
/** Default completion budget when the caller doesn't set one. */
export const AI_DEFAULT_MAX_TOKENS = 800;
/** How long the model catalog cache lives before a refresh is worth trying. */
export const AI_MODELS_CACHE_MS = 24 * 60 * 60 * 1000;

export type AiModel = {
  id: string;
  name: string;
  pricingInPerM: number;
  pricingOutPerM: number;
  contextLength?: number;
};

/** Used when the OpenRouter /models catalog can't be fetched or is empty. */
export const FALLBACK_MODELS: AiModel[] = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", pricingInPerM: 0.15, pricingOutPerM: 0.6, contextLength: 128000 },
  { id: "openai/gpt-4o", name: "GPT-4o", pricingInPerM: 2.5, pricingOutPerM: 10, contextLength: 128000 },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", pricingInPerM: 3, pricingOutPerM: 15, contextLength: 200000 },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", pricingInPerM: 0.25, pricingOutPerM: 1.25, contextLength: 200000 },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5", pricingInPerM: 0.075, pricingOutPerM: 0.3, contextLength: 1000000 },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", pricingInPerM: 1.25, pricingOutPerM: 5, contextLength: 2000000 },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", pricingInPerM: 0.14, pricingOutPerM: 0.28, contextLength: 64000 },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", pricingInPerM: 0.59, pricingOutPerM: 0.79, contextLength: 131000 },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (free)", pricingInPerM: 0, pricingOutPerM: 0, contextLength: 131000 },
  { id: "mistralai/mistral-small", name: "Mistral Small", pricingInPerM: 0.2, pricingOutPerM: 0.2, contextLength: 32000 },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", pricingInPerM: 0.35, pricingOutPerM: 0.4, contextLength: 32000 },
];

export type AiAgentField = { key: string; label: string; placeholder: string };

export type AiAgent = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  fields: AiAgentField[];
  system: string;
  defaultModel: string;
};

/** Prebuilt agents: each is a system prompt + structured inputs. */
export const AI_AGENTS: AiAgent[] = [
  {
    slug: "listing-pitch",
    name: "Listing Pitch Writer",
    emoji: "🚀",
    description: "Turns your product facts into a punchy board listing that earns stars.",
    fields: [
      { key: "name", label: "Product name", placeholder: "e.g. Moonboard" },
      { key: "what", label: "What it does", placeholder: "One or two sentences" },
      { key: "audience", label: "Target audience", placeholder: "e.g. indie hackers" },
    ],
    system:
      "You write product listings for a pay-to-rank startup board. Given product facts, write a 2-sentence tagline followed by 3 short bullet points. Be specific, concrete and energetic. No hashtags, no emojis in bullets.",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    slug: "job-pitch",
    name: "Job Application Pitch",
    emoji: "💼",
    description: "A 100-word pitch tailored to the role — lead with your strongest proof.",
    fields: [
      { key: "role", label: "Role", placeholder: "e.g. Senior Frontend Engineer" },
      { key: "company", label: "Company", placeholder: "e.g. Vercel" },
      { key: "skills", label: "Top skills & proof", placeholder: "e.g. 5y React, shipped X" },
    ],
    system:
      "You write job application pitches (max 120 words). Lead with the strongest concrete proof, map it to the role, end with a single clear call to action. No fluff.",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    slug: "salary-coach",
    name: "Salary Negotiation Coach",
    emoji: "🤝",
    description: "Scripts your counter-offer with anchors and fallback lines.",
    fields: [
      { key: "role", label: "Role", placeholder: "e.g. Product Designer" },
      { key: "offer", label: "Current offer", placeholder: "e.g. $110k + 0.1%" },
      { key: "target", label: "Your target & situation", placeholder: "e.g. want $130k, competing offer" },
    ],
    system:
      "You are a pragmatic salary negotiation coach. Output: 1) a recommended counter number with rationale, 2) a short script the candidate can send verbatim, 3) two fallback lines if the recruiter pushes back. Realistic and specific.",
    defaultModel: "anthropic/claude-3.5-sonnet",
  },
  {
    slug: "job-description",
    name: "Job Description Drafter",
    emoji: "📋",
    description: "Employers: a tight JD — responsibilities, requirements, salary range.",
    fields: [
      { key: "role", label: "Role", placeholder: "e.g. Founding Backend Engineer" },
      { key: "company", label: "Company & stage", placeholder: "e.g. seed-stage fintech, 6 people" },
      { key: "needs", label: "Must-haves", placeholder: "e.g. Go, Postgres, fintech background" },
    ],
    system:
      "You draft concise startup job descriptions: 1-line mission, 4 responsibilities, 4 requirements, and a suggested salary range with a one-line rationale.",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    slug: "auction-strategy",
    name: "Auction Strategy Advisor",
    emoji: "🎯",
    description: "How to spend your bid budget to take or hold the top spot.",
    fields: [
      { key: "listing", label: "Your listing", placeholder: "e.g. Moonboard" },
      { key: "state", label: "Current state", placeholder: "e.g. rank #4, $12 total, leader $40" },
      { key: "budget", label: "Budget & goal", placeholder: "e.g. 3000 credits, want top 3 today" },
    ],
    system:
      "You advise players in a pay-to-rank auction board (boosts add, sabotage subtracts, 5x the leader's total locks #1 for 3h). Given the state and budget, output a concrete spend plan with exact credit amounts and timing, plus one risk to avoid. Max 150 words.",
    defaultModel: "openai/gpt-4o-mini",
  },
];

export function getAgent(slug: string): AiAgent | undefined {
  return AI_AGENTS.find((a) => a.slug === slug);
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Static agent catalog (no DB round-trip needed). */
export const listAgents = query({
  args: {},
  handler: async () => AI_AGENTS,
});

/** Model catalog: cached OpenRouter fetch, falling back to curated list. */
export const listModels = query({
  args: {},
  handler: async (ctx) => {
    const cache = await ctx.db
      .query("aiModelsCache")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (cache && cache.models.length > 0) {
      return {
        models: cache.models as AiModel[],
        fetchedAt: cache.fetchedAt,
        stale: Date.now() - cache.fetchedAt > AI_MODELS_CACHE_MS,
        source: "openrouter" as const,
      };
    }
    return {
      models: FALLBACK_MODELS,
      fetchedAt: 0,
      stale: true,
      source: "fallback" as const,
    };
  },
});

/** The signed-in user's recent AI runs (newest 30). */
export const getMyRuns = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("aiRuns")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
  },
});

// ── Internal ─────────────────────────────────────────────────────────────────

/** Persists a completed AI run (called by the ai.ts action). */
export const recordRun = internalMutation({
  args: {
    userId: v.id("users"),
    model: v.string(),
    agentSlug: v.optional(v.string()),
    prompt: v.string(),
    response: v.optional(v.string()),
    tokensIn: v.number(),
    tokensOut: v.number(),
    creditsCharged: v.number(),
    creditsRefunded: v.optional(v.number()),
    latencyMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiRuns", { ...args, createdAt: Date.now() });
  },
});

/** Writes the refreshed model catalog (called by the ai.ts action). */
export const saveModelsCache = internalMutation({
  args: {
    models: v.array(
      v.object({
        id: v.string(),
        name: v.optional(v.string()),
        pricingInPerM: v.number(),
        pricingOutPerM: v.number(),
        contextLength: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiModelsCache")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        fetchedAt: Date.now(),
        models: args.models,
      });
    } else {
      await ctx.db.insert("aiModelsCache", {
        key: "global",
        fetchedAt: Date.now(),
        models: args.models,
      });
    }
  },
});
