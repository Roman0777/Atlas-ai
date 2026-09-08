// ---- Rank economy (shared by client + backend) ----
/** Free rank credit: $0.10 per star, $2 per successful referral. */
export const STAR_CREDIT_CENTS = 10;
export const REFERRAL_CREDIT_CENTS = 200;
/** Sabotage costs double the target's banked total. */
export const SABOTAGE_MULTIPLIER = 2;
/** Flat fee to list a product. */
export const LISTING_FEE_CENTS = 200;

// Outbid.lol-aligned bid rules
export const MIN_BID_CENTS = 500; // $5 minimum, whole dollars
export const MAX_BID_CENTS = 999_999_00; // $999,999 maximum
export const TOP_SPOT_PREMIUM_CENTS = 500; // $5 extra to take #1

export const CATEGORIES = [
  // ---- Original playful boards ----
  { id: "ai-tools", label: "AI Tools", emoji: "🤖" },
  { id: "saas", label: "SaaS Startups", emoji: "🚀" },
  { id: "extensions", label: "Browser Extensions", emoji: "🧩" },
  { id: "mcp", label: "MCP Servers", emoji: "🔌" },
  { id: "oss", label: "Open Source Repos", emoji: "🦀" },
  { id: "crypto", label: "Crypto, Web3 & Investing", emoji: "₿" },
  { id: "papers", label: "Research Papers", emoji: "📄" },
  // ---- Social media profile boards ----
  { id: "x-profiles", label: "X / Twitter Profiles", emoji: "𝕏" },
  { id: "yt-channels", label: "YouTube Channels", emoji: "📺" },
  { id: "instagram", label: "Instagram Profiles", emoji: "📸" },
  { id: "tiktok", label: "TikTok Creators", emoji: "🎵" },
  { id: "linkedin", label: "LinkedIn Profiles", emoji: "💼" },
  { id: "twitch", label: "Twitch Streamers", emoji: "🎮" },
  { id: "newsletters", label: "Newsletters & Substacks", emoji: "✉️" },
  // ---- Outbid.lol-matched verticals ----
  { id: "agents", label: "AI Agents & Infrastructure", emoji: "🧠" },
  { id: "seo", label: "SEO & AI Visibility", emoji: "🔍" },
  { id: "marketing", label: "Marketing & Advertising", emoji: "📣" },
  { id: "devtools", label: "Developer Tools", emoji: "🧑‍💻" },
  { id: "bizlegal", label: "Business, Finance & Legal", emoji: "⚖️" },
  { id: "security", label: "Security, Privacy & Compliance", emoji: "🛡️" },
  { id: "health", label: "Health, Fitness & Wellness", emoji: "💪" },
  { id: "social", label: "Social Media & Creator Tools", emoji: "📱" },
  { id: "attention", label: "Leaderboards & Attention Markets", emoji: "🏆" },
  { id: "jobs", label: "Hiring, Jobs & Careers", emoji: "💼" },
  { id: "edu", label: "Education & Learning", emoji: "🎓" },
  { id: "agencies", label: "Agencies, Studios & Services", emoji: "🎨" },
  { id: "ecommerce", label: "Ecommerce & Retail", emoji: "🛒" },
  { id: "domains", label: "Domains & Web Assets", emoji: "🌐" },
  { id: "games", label: "Games & Entertainment", emoji: "🕹️" },
  { id: "profiles", label: "People & Profiles", emoji: "👤" },
  { id: "productivity", label: "Productivity & Personal Tools", emoji: "📋" },
  { id: "design", label: "Design & Creative", emoji: "🎨" },
  { id: "writing", label: "Writing & Content", emoji: "✍️" },
  { id: "directories", label: "Directories, Launch & Discovery", emoji: "🧭" },
  { id: "ai-media", label: "AI Media Generation", emoji: "✨" },
  { id: "audio", label: "Audio, Voice & Podcasting", emoji: "🎙️" },
  { id: "sales", label: "Sales & Lead Generation", emoji: "🎯" },
  { id: "travel", label: "Travel, Local & Lifestyle", emoji: "✈️" },
  { id: "realestate", label: "Real Estate & Property", emoji: "🏠" },
  { id: "media", label: "Media & News", emoji: "📰" },
  { id: "other", label: "Other", emoji: "🔮" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as CategoryId[];

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as string[]).includes(value);
}

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
