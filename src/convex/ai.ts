"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  AI_DEFAULT_MAX_TOKENS,
  AI_MARGIN,
  AI_MIN_CHARGE,
  type AiModel,
  getAgent,
} from "./aiCatalog";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function requireKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "AI isn't configured yet — set a key with: bun x convex env set OPENROUTER_API_KEY sk-or-...",
    );
  }
  return key;
}

/** USD → credits at 1 credit = $0.01, with margin, min 1 credit. */
function creditsForCost(usd: number): number {
  return Math.max(AI_MIN_CHARGE, Math.ceil(usd * 100 * AI_MARGIN));
}

/** Refreshes the model catalog from OpenRouter (public endpoint, no key). */
export const syncModels = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ count: number; source: "openrouter" | "failed" }> => {
    try {
      const res = await fetch(`${OPENROUTER_BASE}/models`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          name?: string;
          context_length?: number;
          pricing?: { prompt?: string; completion?: string };
        }>;
      };
      const models = (json.data ?? [])
        .filter((m) => m.id && m.pricing)
        .map((m) => ({
          id: m.id,
          name: m.name,
          pricingInPerM: Number(m.pricing?.prompt ?? 0) * 1e6,
          pricingOutPerM: Number(m.pricing?.completion ?? 0) * 1e6,
          contextLength: m.context_length,
        }))
        .filter(
          (m) =>
            Number.isFinite(m.pricingInPerM) &&
            Number.isFinite(m.pricingOutPerM) &&
            m.pricingInPerM >= 0 &&
            m.pricingOutPerM >= 0,
        )
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 200);
      if (models.length === 0) throw new Error("empty catalog");
      await ctx.runMutation(internal.aiCatalog.saveModelsCache, { models });
      return { count: models.length, source: "openrouter" };
    } catch {
      return { count: 0, source: "failed" };
    }
  },
});

/**
 * Runs one AI call with credit billing:
 *   1. hold an over-estimate from the wallet,
 *   2. call OpenRouter,
 *   3. settle actual token usage and refund the difference,
 *   4. full refund + descriptive error if anything fails.
 */
export const runModel = action({
  args: {
    agentSlug: v.optional(v.string()),
    model: v.optional(v.string()),
    values: v.optional(v.record(v.string(), v.string())),
    prompt: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    text: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    charged: number;
    refunded: number;
    balance: number;
    latencyMs: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const key = requireKey();

    const agent = args.agentSlug ? getAgent(args.agentSlug) : undefined;
    const modelId = args.model ?? agent?.defaultModel ?? "openai/gpt-4o-mini";

    const catalog = await ctx.runQuery(api.aiCatalog.listModels);
    const pricing: AiModel | undefined = catalog.models.find(
      (m) => m.id === modelId,
    );
    if (!pricing) {
      throw new Error(`Unknown model "${modelId}" — pick one from the catalog.`);
    }

    let system: string | undefined;
    let userText: string;
    if (agent) {
      system = agent.system;
      const vals = args.values ?? {};
      userText = agent.fields
        .map((f) => `${f.label}: ${vals[f.key]?.trim() || "(not provided)"}`)
        .join("\n");
    } else {
      userText = (args.prompt ?? "").trim();
    }
    if (!userText) {
      throw new Error("Nothing to run — fill in the fields or write a prompt.");
    }
    const maxTokens = Math.min(
      Math.max(args.maxTokens ?? AI_DEFAULT_MAX_TOKENS, 64),
      4000,
    );

    // Hold an over-estimate (~4 chars/token for the prompt, maxTokens out).
    const estIn =
      Math.ceil(userText.length / 4) +
      (system ? Math.ceil(system.length / 4) : 0);
    const hold = creditsForCost(
      (estIn / 1e6) * pricing.pricingInPerM +
        (maxTokens / 1e6) * pricing.pricingOutPerM,
    );
    const { balance } = await ctx.runMutation(internal.credits.spendCredits, {
      userId,
      amount: hold,
      kind: "ai_usage",
      description: `AI: ${agent?.name ?? modelId}`,
      model: modelId,
    });

    const started = Date.now();
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CONVEX_SITE_URL ?? "http://localhost:5173",
          "X-Title": "auction-engage-pro",
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: userText },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `AI request failed (HTTP ${res.status}): ${body.slice(0, 180)}`,
        );
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        error?: { message?: string };
      };
      if (json.error) {
        throw new Error(json.error.message ?? "AI provider error.");
      }
      const text = json.choices?.[0]?.message?.content ?? "";
      const tokensIn = json.usage?.prompt_tokens ?? estIn;
      const tokensOut =
        json.usage?.completion_tokens ?? Math.ceil(text.length / 4);

      const actual = creditsForCost(
        (tokensIn / 1e6) * pricing.pricingInPerM +
          (tokensOut / 1e6) * pricing.pricingOutPerM,
      );
      const refunded = Math.max(0, hold - actual);
      let finalBalance = balance;
      if (refunded > 0) {
        const r = await ctx.runMutation(internal.credits.grantCredits, {
          userId,
          amount: refunded,
          kind: "ai_refund",
          description: `AI refund: ${agent?.name ?? modelId}`,
          model: modelId,
        });
        finalBalance = r.balance;
      }

      await ctx.runMutation(internal.aiCatalog.recordRun, {
        userId,
        model: modelId,
        agentSlug: args.agentSlug,
        prompt: userText,
        response: text,
        tokensIn,
        tokensOut,
        creditsCharged: hold,
        creditsRefunded: refunded > 0 ? refunded : undefined,
        latencyMs: Date.now() - started,
      });

      return {
        text,
        model: modelId,
        tokensIn,
        tokensOut,
        charged: hold,
        refunded,
        balance: finalBalance,
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      const r = await ctx.runMutation(internal.credits.grantCredits, {
        userId,
        amount: hold,
        kind: "ai_refund",
        description: "AI run failed — full refund",
        model: modelId,
      });
      throw new Error(
        `${err instanceof Error ? err.message : "AI run failed"} (your ${hold} credits were refunded — balance ${r.balance}).`,
      );
    }
  },
});
