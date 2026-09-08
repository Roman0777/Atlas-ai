// ---- The Atlas Dispatch: verified news source registry ----
// Every source here is a publisher-owned RSS / Atom / JSON feed (no scraping).
// Only { enabled: false } or env-gated sources are skipped by the sync.
import type { CategoryId } from "./categories";

export type NewsSource = {
  /** Stable unique key used as dedup prefix in newsItems.sourceKey. */
  key: string;
  /** Publisher display name shown in the UI. */
  name: string;
  /** Publisher homepage, shown as attribution. */
  url: string;
  /** Feed URL (RSS 2.0, Atom, RDF, or JSON). */
  feed: string;
  /** Feed wire format; "auto" sniffs RSS vs Atom vs RDF. */
  format: "rss" | "atom" | "json" | "auto";
  /** Atlas leaderboard category these stories are curated into. */
  category: CategoryId;
  /** Optional env var that must be present for this source to sync. */
  requiresEnv?: string;
  enabled?: boolean;
};

export const NEWS_SOURCES: NewsSource[] = [
  // ---------- News & mainstream tech press ----------
  {
    key: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com",
    feed: "https://techcrunch.com/feed/",
    format: "rss",
    category: "media",
  },
  {
    key: "verge",
    name: "The Verge",
    url: "https://www.theverge.com",
    feed: "https://www.theverge.com/rss/index.xml",
    format: "atom",
    category: "media",
  },
  {
    key: "ars-technica",
    name: "Ars Technica",
    url: "https://arstechnica.com",
    feed: "https://feeds.arstechnica.com/arstechnica/index",
    format: "rss",
    category: "media",
  },
  {
    key: "hackernews",
    name: "Hacker News",
    url: "https://news.ycombinator.com",
    feed: "https://hacker-news.firebaseio.com/v0/topstories.json",
    format: "json",
    category: "attention",
  },

  // ---------- AI tools / labs / research ----------
  {
    key: "openai-news",
    name: "OpenAI",
    url: "https://openai.com/news",
    feed: "https://openai.com/news/rss.xml",
    format: "rss",
    category: "ai-tools",
  },
  {
    key: "google-deepmind",
    name: "Google DeepMind",
    url: "https://deepmind.google",
    feed: "https://deepmind.google/blog/rss.xml",
    format: "rss",
    category: "ai-tools",
  },
  {
    key: "huggingface-blog",
    name: "Hugging Face",
    url: "https://huggingface.co/blog",
    feed: "https://huggingface.co/blog/feed.xml",
    format: "atom",
    category: "ai-tools",
  },
  {
    key: "anthropic-news",
    name: "Anthropic",
    url: "https://www.anthropic.com/news",
    feed: "https://www.anthropic.com/news/rss.xml",
    format: "rss",
    category: "ai-tools",
  },
  {
    key: "arxiv-cs-ai",
    name: "arXiv cs.AI",
    url: "https://arxiv.org/list/cs.AI/recent",
    feed: "https://arxiv.org/rss/cs.AI",
    format: "auto",
    category: "papers",
  },
  {
    key: "arxiv-cs-cl",
    name: "arXiv cs.CL",
    url: "https://arxiv.org/list/cs.CL/recent",
    feed: "https://arxiv.org/rss/cs.CL",
    format: "auto",
    category: "papers",
  },

  // ---------- Product launch / discovery ----------
  {
    key: "producthunt",
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    feed: "https://www.producthunt.com/feed",
    format: "rss",
    category: "directories",
  },
  {
    key: "indiehackers",
    name: "Indie Hackers",
    url: "https://www.indiehackers.com",
    feed: "https://www.indiehackers.com/feed.xml",
    format: "atom",
    category: "saas",
  },

  // ---------- Crypto / investing ----------
  {
    key: "coinjournal",
    name: "CoinJournal",
    url: "https://coinjournal.net",
    feed: "https://coinjournal.net/feed/",
    format: "rss",
    category: "crypto",
  },
  {
    key: "coinmonks",
    name: "Coinmonks",
    url: "https://medium.com/coinmonks",
    feed: "https://medium.com/feed/coinmonks",
    format: "rss",
    category: "crypto",
  },
  {
    key: "coindesk-featured",
    name: "CoinDesk",
    url: "https://www.coindesk.com",
    feed: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    format: "rss",
    category: "crypto",
  },
  {
    key: "seekingalpha-market-currents",
    name: "Seeking Alpha",
    url: "https://seekingalpha.com",
    feed: "https://seekingalpha.com/market_currents.xml",
    format: "rss",
    category: "bizlegal",
  },

  // ---------- Security ----------
  {
    key: "krebs",
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com",
    feed: "https://krebsonsecurity.com/feed/",
    format: "rss",
    category: "security",
  },
  {
    key: "cisa-advisories",
    name: "CISA Advisories",
    url: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    feed: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    format: "rss",
    category: "security",
  },
  {
    key: "thehackernews",
    name: "The Hacker News",
    url: "https://thehackernews.com",
    feed: "https://feeds.feedburner.com/TheHackersNews",
    format: "rss",
    category: "security",
  },
  {
    key: "schneier",
    name: "Schneier on Security",
    url: "https://www.schneier.com",
    feed: "https://www.schneier.com/feed/",
    format: "rss",
    category: "security",
  },

  // ---------- Developer tools / OSS ----------
  {
    key: "github-blog",
    name: "GitHub Blog",
    url: "https://github.blog",
    feed: "https://github.blog/feed/",
    format: "rss",
    category: "devtools",
  },
  {
    key: "rust-blog",
    name: "Rust Blog",
    url: "https://blog.rust-lang.org",
    feed: "https://blog.rust-lang.org/feed.xml",
    format: "atom",
    category: "devtools",
  },
  {
    key: "react-dev",
    name: "React Blog",
    url: "https://react.dev/blog",
    feed: "https://react.dev/rss.xml",
    format: "rss",
    category: "devtools",
  },
  {
    key: "bun-blog",
    name: "Bun Blog",
    url: "https://bun.sh/blog",
    feed: "https://bun.sh/rss.xml",
    format: "rss",
    category: "devtools",
  },
  {
    key: "deno-blog",
    name: "Deno Blog",
    url: "https://deno.com/blog",
    feed: "https://deno.com/feed",
    format: "rss",
    category: "devtools",
  },

  // ---------- Cloud / infra ----------
  {
    key: "aws-news",
    name: "AWS News Blog",
    url: "https://aws.amazon.com/blogs/aws",
    feed: "https://aws.amazon.com/blogs/aws/feed/",
    format: "rss",
    category: "agents",
  },
  {
    key: "google-cloud-blog",
    name: "Google Cloud Blog",
    url: "https://cloud.google.com/blog",
    feed: "https://cloud.google.com/blog/rss.xml",
    format: "rss",
    category: "agents",
  },
  {
    key: "netflix-tech",
    name: "Netflix Tech Blog",
    url: "https://netflixtechblog.com",
    feed: "https://netflixtechblog.com/feed",
    format: "rss",
    category: "agents",
  },
  {
    key: "uber-eng",
    name: "Uber Engineering",
    url: "https://www.uber.com/engineering",
    feed: "https://eng.uber.com/feed/",
    format: "rss",
    category: "agents",
  },
  {
    key: "cloudflare-blog",
    name: "Cloudflare Blog",
    url: "https://blog.cloudflare.com",
    feed: "https://blog.cloudflare.com/rss/",
    format: "rss",
    category: "security",
  },

  // ---------- Video / YouTube ----------
  {
    key: "ycombinator-yt",
    name: "Y Combinator",
    url: "https://www.youtube.com/@YCombinator",
    feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcefcZRL2oaA_uBNeo5UOWg",
    format: "atom",
    category: "yt-channels",
  },
  {
    key: "fireship-yt",
    name: "Fireship",
    url: "https://www.youtube.com/@Fireship",
    feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA",
    format: "atom",
    category: "yt-channels",
  },
  {
    key: "veritasium-yt",
    name: "Veritasium",
    url: "https://www.youtube.com/@veritasium",
    feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCHnyfMqiRRG1u-2MsSQLbXA",
    format: "atom",
    category: "yt-channels",
  },
  {
    key: "mkbhd-yt",
    name: "Marques Brownlee",
    url: "https://www.youtube.com/@mkbhd",
    feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ",
    format: "atom",
    category: "yt-channels",
  },

  // ---------- Newsletters ----------
  {
    key: "stratechery",
    name: "Stratechery",
    url: "https://stratechery.com",
    feed: "https://stratechery.com/feed/",
    format: "rss",
    category: "newsletters",
  },
  {
    key: "lennys-newsletter",
    name: "Lenny's Newsletter",
    url: "https://www.lennysnewsletter.com",
    feed: "https://www.lennysnewsletter.com/feed",
    format: "rss",
    category: "newsletters",
  },
  {
    key: "ai-supremacy",
    name: "AI Supremacy",
    url: "https://aisupremacy.substack.com",
    feed: "https://aisupremacy.substack.com/feed",
    format: "rss",
    category: "newsletters",
  },

  // ---------- Marketing / SEO ----------
  {
    key: "ahrefs-blog",
    name: "Ahrefs Blog",
    url: "https://ahrefs.com/blog",
    feed: "https://ahrefs.com/blog/feed/",
    format: "rss",
    category: "seo",
  },
  {
    key: "semrush-blog",
    name: "Semrush Blog",
    url: "https://www.semrush.com/blog",
    feed: "https://www.semrush.com/blog/feed/",
    format: "rss",
    category: "seo",
  },
  {
    key: "moz-blog",
    name: "Moz Blog",
    url: "https://moz.com/blog",
    feed: "https://moz.com/blog/feed",
    format: "rss",
    category: "seo",
  },

  // ---------- Business / legal / finance ----------
  {
    key: "avc",
    name: "AVC (Fred Wilson)",
    url: "https://avc.com",
    feed: "https://avc.com/feed/",
    format: "rss",
    category: "bizlegal",
  },
  {
    key: "paulgraham",
    name: "Paul Graham",
    url: "https://www.paulgraham.com/articles.html",
    feed: "https://www.paulgraham.com/rss.html",
    format: "rss",
    category: "bizlegal",
  },
  {
    key: "ycombinator-blog",
    name: "Y Combinator Blog",
    url: "https://www.ycombinator.com/blog",
    feed: "https://www.ycombinator.com/blog/rss.xml",
    format: "rss",
    category: "bizlegal",
  },

  // ---------- Jobs / careers ----------
  {
    key: "remotive-rss",
    name: "Remotive",
    url: "https://remotive.com",
    feed: "https://remotive.com/feed",
    format: "rss",
    category: "jobs",
  },

  // ---------- Design ----------
  {
    key: "smashingmag",
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com",
    feed: "https://www.smashingmagazine.com/feed/",
    format: "rss",
    category: "design",
  },
  {
    key: "fonts-in-use",
    name: "Fonts In Use",
    url: "https://fontsinuse.com",
    feed: "https://fontsinuse.com/feed",
    format: "rss",
    category: "design",
  },
  {
    key: "uxdesign-cc",
    name: "UX Collective",
    url: "https://uxdesign.cc",
    feed: "https://uxdesign.cc/feed",
    format: "rss",
    category: "design",
  },

  // ---------- Health / fitness ----------
  {
    key: "examine",
    name: "Examine",
    url: "https://examine.com",
    feed: "https://examine.com/feed.xml",
    format: "rss",
    category: "health",
  },
  {
    key: "strongerbyscience",
    name: "Stronger by Science",
    url: "https://www.strongerbyscience.com",
    feed: "https://www.strongerbyscience.com/feed/",
    format: "rss",
    category: "health",
  },

  // ---------- Games ----------
  {
    key: "gamedeveloper",
    name: "Game Developer",
    url: "https://www.gamedeveloper.com",
    feed: "https://www.gamedeveloper.com/rss.xml",
    format: "rss",
    category: "games",
  },
  {
    key: "phoronix",
    name: "Phoronix",
    url: "https://www.phoronix.com",
    feed: "https://www.phoronix.com/rss.php",
    format: "rss",
    category: "games",
  },

  // ---------- Writing / productivity / edu / travel / audio / ecommerce ----------
  {
    key: "writingcooperative",
    name: "The Writing Cooperative",
    url: "https://writingcooperative.com",
    feed: "https://writingcooperative.com/feed",
    format: "rss",
    category: "writing",
  },
  {
    key: "doist-blog",
    name: "Doist",
    url: "https://blog.doist.com",
    feed: "https://blog.doist.com/feed/",
    format: "rss",
    category: "productivity",
  },
  {
    key: "edx-blog",
    name: "edX",
    url: "https://blog.edx.org",
    feed: "https://blog.edx.org/rss.xml",
    format: "rss",
    category: "edu",
  },
  {
    key: "nomadicmatt",
    name: "Nomadic Matt",
    url: "https://www.nomadicmatt.com",
    feed: "https://www.nomadicmatt.com/feed/",
    format: "rss",
    category: "travel",
  },
  {
    key: "podnews",
    name: "Podnews",
    url: "https://podnews.net",
    feed: "https://podnews.net/rss",
    format: "rss",
    category: "audio",
  },
  {
    key: "shopify-blog",
    name: "Shopify Blog",
    url: "https://www.shopify.com/blog",
    feed: "https://www.shopify.com/blog/rss.xml",
    format: "rss",
    category: "ecommerce",
  },

  // ---------- GitHub releases (JSON API, env-gated) ----------
  {
    key: "gh-releases-ai",
    name: "GitHub Releases · AI",
    url: "https://github.com/ollama/ollama",
    feed: "https://api.github.com/repos/ollama/ollama/releases",
    format: "json",
    category: "ai-tools",
    requiresEnv: "GITHUB_TOKEN",
  },
  {
    key: "gh-releases-devtools",
    name: "GitHub Releases · DevTools",
    url: "https://github.com/vitejs/vite",
    feed: "https://api.github.com/repos/vitejs/vite/releases",
    format: "json",
    category: "devtools",
    requiresEnv: "GITHUB_TOKEN",
  },

  // ---------- X / Instagram / TikTok (API slots, env-gated) ----------
  {
    key: "x-openai",
    name: "X · OpenAI",
    url: "https://x.com/OpenAI",
    feed: "https://api.x.com/2/tweets/search/recent?query=from:OpenAI&max_results=10",
    format: "json",
    category: "x-profiles",
    requiresEnv: "X_BEARER_TOKEN",
  },
  {
    key: "x-anthropic",
    name: "X · Anthropic",
    url: "https://x.com/AnthropicAI",
    feed: "https://api.x.com/2/tweets/search/recent?query=from:AnthropicAI",
    format: "json",
    category: "x-profiles",
    requiresEnv: "X_BEARER_TOKEN",
  },
  {
    key: "instagram-openai",
    name: "Instagram · OpenAI",
    url: "https://www.instagram.com/openai",
    feed: "https://graph.instagram.com/me/media?fields=caption,permalink,timestamp",
    format: "json",
    category: "instagram",
    requiresEnv: "IG_ACCESS_TOKEN",
  },
  {
    key: "tiktok-openai",
    name: "TikTok · OpenAI",
    url: "https://www.tiktok.com/@openai",
    feed: "https://open.tiktokapis.com/v2/video/list/",
    format: "json",
    category: "tiktok",
    requiresEnv: "TIKTOK_ACCESS_TOKEN",
  },
];

export const ENABLED_NEWS_SOURCES = NEWS_SOURCES.filter(
  (s) => s.enabled !== false,
);
