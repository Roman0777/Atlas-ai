"use node";

import {
  action,
  internalAction,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { XMLParser } from "fast-xml-parser";
import { ENABLED_NEWS_SOURCES, type NewsSource } from "../lib/news-sources";

// ---------- Normalized story shape ----------

export type NormalizedNews = {
  externalId: string;
  title: string;
  url: string;
  summary?: string;
  author?: string;
  imageUrl?: string;
  publishedAt: number;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  // Keep single entries as arrays so iteration is uniform.
  isArray: (name) =>
    name === "item" || name === "entry" || name === "enclosure" || name === "link",
});

// ---------- Helpers ----------

/** Strip HTML tags + entities and collapse whitespace. */
export function cleanText(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : undefined;
}

/** Truncate to a max length on a word boundary. */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Parse an RFC-822 / ISO date into a ms epoch, falling back to now. */
function parseDate(raw?: string | number | null): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  return Date.now();
}

/** FNV-1a hash for stable content-derived ids. */
function hashId(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function pickText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"] as string;
    if (typeof obj["@_href"] === "string") return obj["@_href"] as string;
  }
  return undefined;
}

/** Best-effort image extraction from RSS/Atom entry fields. */
function pickImage(entry: Record<string, unknown>): string | undefined {
  const enclosures = entry["enclosure"];
  if (Array.isArray(enclosures)) {
    for (const enc of enclosures) {
      const e = enc as Record<string, unknown>;
      const type = String(e["@_type"] ?? "");
      const url = e["@_url"];
      if (typeof url === "string" && (type === "" || type.startsWith("image/"))) {
        return url;
      }
    }
  }
  for (const key of ["media:content", "media:thumbnail", "itunes:image"]) {
    const media = entry[key] as Record<string, unknown> | undefined;
    const url = media?.["@_url"] ?? media?.["@_href"];
    if (typeof url === "string") return url;
  }
  // Inline <img src> in the description as a last resort.
  const desc = String(entry["description"] ?? entry["content"] ?? "");
  const match = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

// ---------- Feed parsing ----------

/** Parse RSS 2.0 / Atom / RDF XML into normalized stories. */
export function parseFeedXml(xml: string): NormalizedNews[] {
  const parsed = xmlParser.parse(xml) as Record<string, unknown>;
  const channel = (parsed["rss"] as Record<string, unknown>)?.["channel"] as
    | Record<string, unknown>
    | undefined;
  const rdf = parsed["rdf:RDF"] as Record<string, unknown> | undefined;
  const atomFeed = parsed["feed"] as Record<string, unknown> | undefined;

  let entries: Record<string, unknown>[] = [];
  if (channel) {
    entries = (channel["item"] as Record<string, unknown>[]) ?? [];
  } else if (rdf) {
    entries = (rdf["item"] as Record<string, unknown>[]) ?? [];
  } else if (atomFeed) {
    entries = (atomFeed["entry"] as Record<string, unknown>[]) ?? [];
  }

  const out: NormalizedNews[] = [];
  for (const entry of entries.slice(0, 40)) {
    const title = cleanText(pickText(entry["title"]));
    let link = pickText(entry["link"]);
    if (!link && typeof entry["guid"] !== "undefined") {
      const guid = entry["guid"] as Record<string, unknown> | string;
      const maybe = typeof guid === "string" ? guid : (guid["#text"] as string);
      if (maybe?.startsWith("http")) link = maybe;
    }
    if (!title || !link) continue;

    const summary = cleanText(
      pickText(entry["description"]) ??
        pickText(entry["summary"]) ??
        pickText(entry["content"]) ??
        pickText(entry["content:encoded"]),
    );
    const publishedAt = parseDate(
      pickText(entry["pubDate"]) ??
        pickText(entry["published"]) ??
        pickText(entry["updated"]) ??
        pickText(entry["dc:date"]),
    );
    const author = cleanText(
      pickText(entry["dc:creator"]) ??
        pickText(
          (entry["author"] as Record<string, unknown> | undefined)?.["name"],
        ),
    );

    out.push({
      externalId:
        cleanText(pickText(entry["guid"])) ??
        cleanText(pickText(entry["id"])) ??
        hashId(`${title}|${link}`),
      title: clamp(title, 300),
      url: link,
      summary: summary ? clamp(summary, 500) : undefined,
      author,
      imageUrl: pickImage(entry),
      publishedAt,
    });
  }
  return out;
}

// ---------- JSON adapters ----------

/** Hacker News top stories: two-step fetch (id list, then each item). */
async function fetchHackerNews(feed: string): Promise<NormalizedNews[]> {
  const ids = (await (await fetch(feed)).json()) as number[];
  const top = ids.slice(0, 20);
  const stories = await Promise.all(
    top.map(async (id) => {
      try {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        );
        return (await res.json()) as {
          id: number;
          title?: string;
          url?: string;
          by?: string;
          time?: number;
          text?: string;
        };
      } catch {
        return null;
      }
    }),
  );
  return stories
    .filter((s): s is NonNullable<typeof s> => !!s?.title)
    .map((s) => ({
      externalId: `hn-${s.id}`,
      title: s.title!,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      summary: cleanText(s.text),
      author: s.by,
      publishedAt: (s.time ?? Date.now() / 1000) * 1000,
    }));
}

/** GitHub releases API for a single repo. */
async function fetchGithubReleases(feed: string): Promise<NormalizedNews[]> {
  const res = await fetch(feed, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return [];
  const releases = (await res.json()) as {
    id: number;
    name?: string | null;
    tag_name?: string;
    html_url?: string;
    body?: string | null;
    published_at?: string;
    author?: { login?: string };
  }[];
  return releases.slice(0, 10).map((r) => ({
    externalId: `gh-${r.id}`,
    title: r.name || r.tag_name || `Release ${r.id}`,
    url: r.html_url ?? feed,
    summary: r.body ? clamp(cleanText(r.body) ?? "", 500) : undefined,
    author: r.author?.login,
    publishedAt: parseDate(r.published_at),
  }));
}

/** X (Twitter) API v2 recent tweets for an account. */
async function fetchXPosts(
  feed: string,
  bearer: string,
): Promise<NormalizedNews[]> {
  const url = new URL(feed);
  url.searchParams.set("tweet.fields", "created_at,author_id,text");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: { id: string; text: string; created_at?: string }[];
  };
  return (data.data ?? []).map((t) => ({
    externalId: `x-${t.id}`,
    title: clamp(t.text.split("\n")[0] ?? t.text, 200),
    url: `https://x.com/i/web/status/${t.id}`,
    summary: cleanText(t.text),
    publishedAt: parseDate(t.created_at),
  }));
}

/** Instagram Graph API media for a connected account. */
async function fetchInstagramMedia(
  feed: string,
  token: string,
): Promise<NormalizedNews[]> {
  const res = await fetch(`${feed}&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: {
      id: string;
      caption?: string;
      permalink?: string;
      timestamp?: string;
    }[];
  };
  return (data.data ?? []).slice(0, 10).map((m) => ({
    externalId: `ig-${m.id}`,
    title: clamp((m.caption ?? "Instagram post").split("\n")[0], 200),
    url: m.permalink ?? "https://instagram.com",
    summary: cleanText(m.caption),
    publishedAt: parseDate(m.timestamp),
  }));
}

/** TikTok video list (requires a pre-authorized access token). */
async function fetchTikTokVideos(
  feed: string,
  token: string,
): Promise<NormalizedNews[]> {
  const res = await fetch(feed, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: {
      videos?: {
        id: string;
        title?: string;
        create_time?: number;
        embed_link?: string;
      }[];
    };
  };
  return (data.data?.videos ?? []).slice(0, 10).map((v) => ({
    externalId: `tt-${v.id}`,
    title: clamp(v.title ?? `Video ${v.id}`, 200),
    url: v.embed_link ?? "https://www.tiktok.com",
    publishedAt: v.create_time ? v.create_time * 1000 : Date.now(),
  }));
}

// ---------- Sync plumbing ----------

/** Fetch + parse one feed into normalized stories. */
async function fetchSource(source: NewsSource): Promise<NormalizedNews[]> {
  const envValue = source.requiresEnv ? process.env[source.requiresEnv] : "";
  if (source.requiresEnv && !envValue) return [];

  if (source.format === "json") {
    if (source.key === "hackernews") return fetchHackerNews(source.feed);
    if (source.key.startsWith("gh-releases")) return fetchGithubReleases(source.feed);
    if (source.key.startsWith("x-") && envValue)
      return fetchXPosts(source.feed, envValue);
    if (source.key.startsWith("instagram-") && envValue)
      return fetchInstagramMedia(source.feed, envValue);
    if (source.key.startsWith("tiktok-") && envValue)
      return fetchTikTokVideos(source.feed, envValue);
    return [];
  }

  const res = await fetch(source.feed, {
    headers: {
      // Some feeds 403 without a UA.
      "User-Agent": "AtlasDispatch/1.0",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseFeedXml(xml);
}

/** Upsert a batch of normalized stories for one source; returns count. */
async function upsertBatch(
  ctx: ActionCtx,
  source: NewsSource,
  stories: NormalizedNews[],
): Promise<number> {
  let count = 0;
  for (const story of stories.slice(0, 30)) {
    const existing = await ctx.runQuery(
      internal.newsInternal._getBySourceAndExternal,
      { sourceKey: source.key, externalId: story.externalId },
    );
    const fetchedAt = Date.now();
    if (existing && existing.length > 0) {
      await ctx.runMutation(internal.newsInternal._updateItem, {
        id: existing[0]._id,
        title: story.title,
        url: story.url,
        summary: story.summary,
        imageUrl: story.imageUrl,
        publishedAt: story.publishedAt,
        fetchedAt,
      });
    } else {
      await ctx.runMutation(internal.newsInternal._insertItem, {
        sourceKey: source.key,
        sourceName: source.name,
        sourceUrl: source.url,
        category: source.category,
        externalId: story.externalId,
        title: story.title,
        url: story.url,
        summary: story.summary,
        author: story.author,
        imageUrl: story.imageUrl,
        publishedAt: story.publishedAt,
        fetchedAt,
      });
    }
    count++;
  }
  return count;
}

/** Upsert sync metadata for one source. */
async function upsertSyncMeta(
  ctx: ActionCtx,
  sourceKey: string,
  status: "ok" | "error",
  itemsAdded: number,
  itemCount: number,
  error?: string,
): Promise<void> {
  const existing = await ctx.runQuery(internal.newsInternal._getSyncMeta, {
    sourceKey,
  });
  const lastSyncAt = Date.now();
  if (existing) {
    await ctx.runMutation(internal.newsInternal._updateSyncMeta, {
      id: existing._id,
      lastSyncAt,
      status,
      itemsAdded,
      itemCount,
      error,
    });
  } else {
    await ctx.runMutation(internal.newsInternal._insertSyncMeta, {
      sourceKey,
      lastSyncAt,
      status,
      itemsAdded,
      itemCount,
      error,
    });
  }
}

/** Sync a single source end to end; never throws. */
async function syncOneSource(
  ctx: ActionCtx,
  source: NewsSource,
): Promise<{ source: string; count: number; error?: string }> {
  try {
    const stories = await fetchSource(source);
    const count = await upsertBatch(ctx, source, stories);
    await upsertSyncMeta(ctx, source.key, "ok", count, count);
    return { source: source.key, count };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    try {
      await upsertSyncMeta(ctx, source.key, "error", 0, 0, message);
    } catch {
      // Meta write is best-effort.
    }
    return { source: source.key, count: 0, error: message };
  }
}

/** Stable shard assignment so each cron run touches a deterministic slice. */
function shardIndexOf(key: string, shardCount: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % shardCount;
}

// ---------- Public actions ----------

/**
 * Refresh a time-sliced shard of sources. The hourly cron cycles
 * shard 0..shardCount-1 so every source is refreshed every few hours
 * while each run stays well inside Convex action time limits.
 */
export const refreshNewsShard = internalAction({
  args: { shard: v.number(), shardCount: v.number() },
  handler: async (ctx, args) => {
    const results: { source: string; count: number; error?: string }[] = [];
    for (const source of ENABLED_NEWS_SOURCES) {
      if (source.requiresEnv && !process.env[source.requiresEnv]) continue;
      if (shardIndexOf(source.key, args.shardCount) !== args.shard) continue;
      results.push(await syncOneSource(ctx, source));
    }
    return results;
  },
});

/**
 * Manual refresh: pulls a bounded batch of unlocked sources for the
 * "Refresh now" button. Env-gated sources are included only when
 * their credentials are present.
 */
export const refreshNews = action({
  args: { maxSources: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results: { source: string; count: number; error?: string }[] = [];
    const cap = args.maxSources ?? 8;
    let used = 0;
    for (const source of ENABLED_NEWS_SOURCES) {
      if (used >= cap) break;
      if (source.requiresEnv && !process.env[source.requiresEnv]) continue;
      results.push(await syncOneSource(ctx, source));
      used++;
      // Be polite to publishers.
      await new Promise((r) => setTimeout(r, 150));
    }
    return results;
  },
});

// ---------- Newsletter confirmation email (Resend) ----------

const FROM_ADDRESS = "The Atlas Dispatch <dispatch@resend.dev>";
const fromAddress = process.env.NEWSLETTER_FROM ?? FROM_ADDRESS;

/**
 * Send the double opt-in confirmation email via Resend.
 * No-op (returns "skipped") when RESEND_API_KEY is not configured.
 */
export const sendConfirmationEmail = action({
  args: { to: v.string(), token: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return "skipped" as const;

    const appUrl = process.env.CONVEX_SITE_URL ?? "http://localhost:5173";
    const confirmUrl = `${appUrl}/news?confirm=${encodeURIComponent(args.token)}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [args.to],
        subject: "Confirm your Atlas Dispatch subscription",
        html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto">
  <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888">The Atlas Dispatch</p>
  <h1 style="font-size:20px;margin:8px 0">Confirm your subscription</h1>
  <p style="font-size:14px;color:#444;line-height:1.6">
    One tap and you're in. Every weekday you'll get the top stories from
    across the Atlas leaderboards — AI, crypto, security, dev tools and more.
  </p>
  <p style="margin:24px 0">
    <a href="${confirmUrl}" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;text-decoration:none">
      Confirm subscription
    </a>
  </p>
  <p style="font-size:11px;color:#999">Didn't request this? Ignore this email and you won't be subscribed.</p>
</div>`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    }
    return "sent" as const;
  },
});
