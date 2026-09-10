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
  { id: "ai-tools", label: "AI Tools", icon: "bot" },
  { id: "saas", label: "SaaS Startups", icon: "rocket" },
  { id: "extensions", label: "Browser Extensions", icon: "puzzle" },
  { id: "mcp", label: "MCP Servers", icon: "plug" },
  { id: "oss", label: "Open Source Repos", icon: "git-branch" },
  { id: "crypto", label: "Crypto, Web3 & Investing", icon: "bitcoin" },
  { id: "papers", label: "Research Papers", icon: "file-text" },
  // ---- Social media profile boards ----
  { id: "x-profiles", label: "X / Twitter Profiles", icon: "at-sign" },
  { id: "yt-channels", label: "YouTube Channels", icon: "youtube" },
  { id: "instagram", label: "Instagram Profiles", icon: "instagram" },
  { id: "tiktok", label: "TikTok Creators", icon: "music" },
  { id: "linkedin", label: "LinkedIn Profiles", icon: "linkedin" },
  { id: "twitch", label: "Twitch Streamers", icon: "twitch" },
  { id: "newsletters", label: "Newsletters & Substacks", icon: "mail" },
  // ---- Outbid.lol-matched verticals ----
  { id: "agents", label: "AI Agents & Infrastructure", icon: "brain" },
  { id: "seo", label: "SEO & AI Visibility", icon: "search" },
  { id: "marketing", label: "Marketing & Advertising", icon: "megaphone" },
  { id: "devtools", label: "Developer Tools", icon: "code" },
  { id: "bizlegal", label: "Business, Finance & Legal", icon: "scale" },
  { id: "security", label: "Security, Privacy & Compliance", icon: "shield-check" },
  { id: "health", label: "Health, Fitness & Wellness", icon: "heart-pulse" },
  { id: "social", label: "Social Media & Creator Tools", icon: "smartphone" },
  { id: "attention", label: "Leaderboards & Attention Markets", icon: "trophy" },
  { id: "jobs", label: "Hiring, Jobs & Careers", icon: "briefcase" },
  { id: "edu", label: "Education & Learning", icon: "graduation-cap" },
  { id: "agencies", label: "Agencies, Studios & Services", icon: "palette" },
  { id: "ecommerce", label: "Ecommerce & Retail", icon: "cart" },
  { id: "domains", label: "Domains & Web Assets", icon: "globe" },
  { id: "games", label: "Games & Entertainment", icon: "gamepad" },
  { id: "profiles", label: "People & Profiles", icon: "user" },
  { id: "productivity", label: "Productivity & Personal Tools", icon: "clipboard" },
  { id: "design", label: "Design & Creative", icon: "palette" },
  { id: "writing", label: "Writing & Content", icon: "pen" },
  { id: "directories", label: "Directories, Launch & Discovery", icon: "compass" },
  { id: "ai-media", label: "AI Media Generation", icon: "sparkles" },
  { id: "audio", label: "Audio, Voice & Podcasting", icon: "mic" },
  { id: "sales", label: "Sales & Lead Generation", icon: "target" },
  { id: "travel", label: "Travel, Local & Lifestyle", icon: "plane" },
  { id: "realestate", label: "Real Estate & Property", icon: "home" },
  { id: "media", label: "Media & News", icon: "newspaper" },
  { id: "other", label: "Other", icon: "telescope" },
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
