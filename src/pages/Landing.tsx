import { AnimatedCents } from "@/components/animated-number";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Particles } from "@/components/particles";
import { FluidOrbs } from "@/components/fluid-orb";
import { AtlasGlobeHeroLazy as WireframeGlobe } from "@/components/atlas-globe-lazy";
import { Magnetic } from "@/components/magnetic-button";
import { CompassRose } from "@/components/compass-rose";
import { BoardingPass } from "@/components/boarding-pass";
import { CoordinatesTicker } from "@/components/coordinates-ticker";
import { TiltCard } from "@/components/tilt-card";
import { api } from "@/convex/_generated/api";
import { REFERRAL_CREDIT_CENTS, STAR_CREDIT_CENTS } from "@/lib/categories";
import { CATEGORIES, formatCents } from "@/lib/categories";
import { EASE, fadeUp, springSnappy, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { type PointerEvent as ReactPointerEvent, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Boxes,
  Crown,
  Gavel,
  Medal,
  ThumbsDown,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router";

function faviconUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

/** Feed the .spotlight overlay with cursor position (see index.css). */
function trackSpotlight(e: ReactPointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const DEMO_ROWS = [
  { rank: "🥇", title: "Nebula Copilot", cat: "🤖 AI Tools", paid: 4120, locked: true },
  { rank: "🥈", title: "Shipfast.dev", cat: "🚀 SaaS", paid: 2860, locked: false },
  { rank: "🥉", title: "TabWrangler", cat: "🧩 Extensions", paid: 1930, locked: false },
];

const RANK_RULES = [
  {
    step: "01",
    title: "List for $5",
    body: "A flat $5 puts your product on a board. Every position starts at zero — rank is earned from there.",
  },
  {
    step: "02",
    title: "Bank money to climb",
    body: `Boosts add straight to your total. Stars add $${(
      STAR_CREDIT_CENTS / 100
    ).toFixed(2)} each and referrals add $${(
      REFERRAL_CREDIT_CENTS / 100
    ).toFixed(2)} each of free rank credit.`,
  },
  {
    step: "03",
    title: "Defend with the 5× lock",
    body: "Drop 5× the runner-up's bank in one hit and your #1 spot locks for 3 hours. Money can't be touched during the lock.",
  },
  {
    step: "04",
    title: "War has a price",
    body: "Sabotage costs 2× the target's banked total. Outbid? Retake #1 for just the difference + $5.",
  },
];

const CATEGORY_GROUPS = [
  { id: "all", label: "All" },
  { id: "tech", label: "Tech & AI" },
  { id: "social", label: "Social" },
  { id: "business", label: "Business" },
  { id: "creative", label: "Creative" },
];

const GROUP_IDS: Record<string, string[]> = {
  tech: ["ai-tools", "saas", "extensions", "mcp", "oss", "agents", "seo", "devtools", "ai-media"],
  social: ["x-profiles", "yt-channels", "instagram", "tiktok", "linkedin", "twitch", "newsletters", "social"],
  business: ["bizlegal", "security", "marketing", "ecommerce", "sales", "hiring", "agencies", "realestate", "domains"],
  creative: ["design", "writing", "games", "audio", "media", "papers", "education", "health", "travel", "productivity", "leaderboards", "directories", "crypto", "people"],
};

function CategoryLeaderCards({ filter }: { filter: string }) {
  const leaders = useQuery(api.listings.getCategoryLeaders);
  const leaderMap = new Map(
    (leaders ?? []).map((l) => [l.categoryId, l])
  );
  const filtered = filter === "all"
    ? CATEGORIES
    : CATEGORIES.filter((c) => GROUP_IDS[filter]?.includes(c.id));

  return (
    <motion.div
      variants={stagger(0.02)}
      initial="hidden"
      animate="show"
      className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {filtered.map((c) => {
        const leader = leaderMap.get(c.id);
        const fav = faviconUrl(leader?.leaderUrl ?? null);
        return (
          <motion.div key={c.id} variants={fadeUp} whileHover={{ y: -2, transition: springSnappy }}>
            <Link
              to={`/board?category=${c.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-primary/40 hover:shadow-card-hover"
            >
              {/* Circular icon — emoji only, no text inside */}
              <span className="icon-tile size-10 overflow-hidden text-sm leading-none">
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-snug">
                  {c.label}
                </span>
                {leader?.leaderTitle ? (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground/70">
                    {fav ? (
                      <img
                        src={fav}
                        alt=""
                        className="size-3 shrink-0 rounded-sm"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="truncate">{leader.leaderTitle}</span>
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground/40">
                    Be the first to list
                  </span>
                )}
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function BoardsSection() {
  const [group, setGroup] = useState("all");
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="font-label flex items-center gap-2 text-xs font-medium text-primary"
            >
              <span className="inline-block size-2 rounded-full bg-primary" />
              {CATEGORIES.length} boards
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="type-display mt-3"
            >
              One rule: money talks.
            </motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            <Link to="/board">
              <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                View all boards <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Filter chips — beautifului.dev filter table pattern */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORY_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={cn(
                "relative rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                group === g.id
                  ? "border-primary text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {group === g.id && (
                <motion.span
                  layoutId="landing-filter-pill"
                  transition={springSnappy}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <span className="relative z-10">{g.label}</span>
            </button>
          ))}
        </div>

        <CategoryLeaderCards filter={group} />
      </div>
    </section>
  );
}

function NextUnicorn() {
  const ideas = [
    {
      name: "AI Code Review Agent",
      tagline: "Automated PR reviews that catch bugs before CI",
      market: "$4.2B",
      traffic: "12K/mo",
      competition: "Medium",
      score: 92,
      category: "🤖 AI Tools",
      growth: "+340%",
    },
    {
      name: "Micro-SaaS Billing OS",
      tagline: "Stripe + usage-based pricing in a box",
      market: "$8.7B",
      traffic: "8.5K/mo",
      competition: "High",
      score: 87,
      category: "🚀 SaaS",
      growth: "+210%",
    },
    {
      name: "Social SEO Analyzer",
      tagline: "Rank your tweets and threads on Google",
      market: "$2.1B",
      traffic: "22K/mo",
      competition: "Low",
      score: 95,
      category: "🔍 SEO",
      growth: "+520%",
    },
    {
      name: "Founder Finance Copilot",
      tagline: "Cash runway, burn rate, investor-ready reports",
      market: "$6.3B",
      traffic: "5.8K/mo",
      competition: "Medium",
      score: 84,
      category: "⚖️ Finance",
      growth: "+180%",
    },
    {
      name: "AI Meeting Notes → Tasks",
      tagline: "Zoom call to Jira tickets in 30 seconds",
      market: "$3.5B",
      traffic: "15K/mo",
      competition: "High",
      score: 79,
      category: "📋 Productivity",
      growth: "+290%",
    },
    {
      name: "One-Click Deploy Marketplace",
      tagline: "Sell your app template, deploy with a click",
      market: "$1.8B",
      traffic: "9.2K/mo",
      competition: "Low",
      score: 91,
      category: "🧑‍💻 DevTools",
      growth: "+410%",
    },
  ];

  return (
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-label flex items-center gap-2 text-xs font-medium text-primary">
                <span className="inline-block size-2 rounded-full bg-primary" />
                Idea validation
              </p>
              <h2 className="type-display mt-3">
                The next unicorn starts here.
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Market size, traffic signals, and competition — ranked by
                validation score. List your idea and let the board decide.
              </p>
            </div>
            <a
              href="/auth?returnTo=%2Fboard"
              className="font-label rounded-full border border-primary/40 px-4 py-2 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              Submit your idea →
            </a>
          </motion.div>

          {/* Validation cards grid — transitions.dev stagger */}
          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {ideas.map((idea) => (
              <motion.div
                key={idea.name}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="group rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-card-hover"
              >
                {/* Header: category + score */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/70">{idea.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label text-[10px] text-muted-foreground">VALIDATION</span>
                    <span className={`font-mono text-sm font-bold ${
                      idea.score >= 90 ? "text-primary" : idea.score >= 80 ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {idea.score}
                    </span>
                  </div>
                </div>

                {/* Name + tagline */}
                <h3 className="mt-3 font-display text-base font-bold leading-snug">
                  {idea.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {idea.tagline}
                </p>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/60">MARKET</span>
                    <p className="font-mono text-xs font-bold">{idea.market}</p>
                  </div>
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/60">TRAFFIC</span>
                    <p className="font-mono text-xs font-bold">{idea.traffic}</p>
                  </div>
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/60">GROWTH</span>
                    <p className="font-mono text-xs font-bold text-primary">{idea.growth}</p>
                  </div>
                </div>

                {/* Competition bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label text-[9px] text-muted-foreground/60">COMPETITION</span>
                    <span className={`text-[10px] font-medium ${
                      idea.competition === "Low" ? "text-green-600" : idea.competition === "Medium" ? "text-yellow-600" : "text-red-500"
                    }`}>
                      {idea.competition}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary/60">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idea.competition === "Low" ? "bg-green-500/60 w-1/3" : idea.competition === "Medium" ? "bg-yellow-500/60 w-2/3" : "bg-red-400/60 w-full"
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Landing() {
  const stats = useQuery(api.listings.getStats);
  const topReferrers = useQuery(api.referrals.getTopReferrers);

  const potStats: {
    label: string;
    cents?: number;
    value?: number;
    icon: ReactNode;
    foot: string;
  }[] = [
    {
      label: "On the board",
      cents: stats?.potCents,
      icon: <Trophy className="size-4" />,
      foot: "total banked",
    },
    {
      label: "Sabotage paid",
      cents: stats?.sabotageCents,
      icon: <ThumbsDown className="size-4" />,
      foot: "drag-downs on rivals",
    },
    {
      label: "Paid moves",
      value: stats?.bidCount,
      icon: <Gavel className="size-4" />,
      foot: "receipts on file",
    },
    {
      label: "Products listed",
      value: stats?.listingCount,
      icon: <Boxes className="size-4" />,
      foot: "live on the board",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass-strong shadow-[0_1px_0_color-mix(in_oklab,var(--border)_55%,transparent),0_12px_32px_-20px_oklch(0.2_0.04_175/0.25)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
              AI
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              Atlas<span className="text-primary">.</span>
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="font-label rounded-full px-3.5 text-xs text-primary hover:text-primary">
              <Link to="/board">Discover</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="font-label rounded-full px-3.5 text-xs">
              <Link to="/jobs">Jobs</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="font-label rounded-full px-3.5 text-xs">
              <Link to="/rules">Rules</Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm" className="font-label rounded-full text-xs">
              <Link to="/auth?returnTo=%2Fdashboard">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-printed grain relative overflow-hidden border-b border-border/60">
        <CompassRose className="pointer-events-none absolute -left-24 -top-24 size-80 text-foreground opacity-[0.07]" />
        <Particles count={20} />
        <WireframeGlobe className="-right-32 top-1/2 -translate-y-1/2 lg:right-[5%]" />
        <FluidOrbs />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <motion.div
            variants={stagger(0.09, 0.05)}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              className="font-label mb-4 flex items-center gap-2 text-xs font-medium text-primary"
            >
              <span className="inline-block size-2 rounded-full bg-primary" />
              Atlas AI
            </motion.p>
            <h1 className="type-display-lg">
              <span className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.85, ease: EASE, delay: 0.15 }}
                >
                  The useful
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-2">
                <motion.span
                  className="text-gradient-animated block"
                  style={{ fontStyle: "italic", fontFamily: '"DM Serif Display", ui-serif, Georgia, serif' }}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.85, ease: EASE, delay: 0.27 }}
                >
                  stuff.
                </motion.span>
              </span>
            </h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              A considered index of AI tools, extensions, servers, research,
              and the people making them worth your time.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-lg text-sm text-muted-foreground/80"
            >
              Star what you love free. Boost your own with real dollars — or{" "}
              <span className="text-accent-orange">
                pay to down-rank a rival
              </span>
              . Every position is backed by receipts.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild size="lg" className="group gap-2 rounded-full">
                  <Link to="/board">
                    See the boards
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <Button asChild size="lg" variant="metal" className="rounded-full">
                  <Link to="/auth?returnTo=%2Fdashboard">List your product</Link>
                </Button>
              </Magnetic>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="font-label mt-4 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              {["$5 to list", "boosts from $5", "stars free", "invites +$2"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5"
                  >
                    {t}
                  </span>
                ),
              )}
            </motion.p>
          </motion.div>

          {/* Mock leaderboard card */}
          <TiltCard className="relative hairline">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
              className="hero-card overflow-hidden rounded-2xl border"
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="icon-tile size-7 text-[13px]">
                    🏆
                  </span>
                  <span className="font-label text-[11px] uppercase tracking-wide text-foreground">
                    Today's money
                  </span>
                </div>
                <span className="font-label flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-primary opacity-60" />
                    <span className="inline-flex size-1.5 rounded-full bg-primary" />
                  </span>
                  live
                </span>
              </div>

              {/* Column labels */}
              <div className="flex items-center gap-3 border-b border-border/40 bg-secondary/30 px-4 py-1.5">
                <span className="w-7 text-center font-label text-[9px] uppercase tracking-wide text-muted-foreground/60">
                  rank
                </span>
                <span className="flex-1 font-label text-[9px] uppercase tracking-wide text-muted-foreground/60">
                  product
                </span>
                <span className="pr-1 font-label text-[9px] uppercase tracking-wide text-muted-foreground/60">
                  bank
                </span>
              </div>

              <ul className="divide-y divide-border/50">
                {DEMO_ROWS.map((r, i) => (
                  <motion.li
                    key={r.title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={
                      i === 0
                        ? { opacity: 1, x: [0, -4, 0] }
                        : { opacity: 1, x: 0 }
                    }
                    transition={
                      i === 0
                        ? { delay: 0.7, duration: 0.5, repeat: Infinity, repeatDelay: 3 }
                        : { delay: 0.7 + i * 0.1, duration: 0.5, ease: EASE }
                    }
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="icon-tile size-7 shrink-0 font-mono text-[11px] font-bold tabular-nums">
                      {r.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="icon-tile size-4 place-items-center text-[9px] leading-none">
                          {r.cat.split(" ")[0]}
                        </span>
                        <span className="truncate">
                          {r.cat.slice(r.cat.indexOf(" ") + 1)}
                        </span>
                      </p>
                    </div>
                    {r.locked ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-primary">
                        <Crown className="size-3" />
                        LOCKED
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 font-label text-[9px] uppercase tracking-wide text-muted-foreground">
                        open
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">
                      {formatCents(r.paid)}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* Activity feed note */}
              <div className="flex items-center gap-2 border-t border-border/60 bg-card/40 px-4 py-2.5">
                <span className="rounded-full border border-border/60 px-2 py-0.5 font-label text-[9px] uppercase tracking-wide text-muted-foreground">
                  vs
                </span>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  👎 Shipfast.dev down-ranked for $50 → #2
                </p>
              </div>
            </motion.div>
          </TiltCard>
        </div>
      </section>

      {/* Category ticker — editorial marquee */}
      <div
        aria-hidden
        className="fade-mask-x relative overflow-hidden border-b border-border/60 bg-secondary/50 py-3"
      >
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <span
              key={i}
              className="font-label flex items-center gap-2.5 px-4 text-[11px] text-muted-foreground"
            >
              <span className="icon-tile size-6 overflow-hidden text-[10px] leading-none">
                {c.emoji}
              </span>
              {c.label}
              <span className="text-primary/70">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Live money stats — the whole pot, in public */}
      <section className="border-b border-border/50 bg-card/60">
        <div aria-hidden className="beam-line" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {potStats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              onPointerMove={trackSpotlight}
              className="spotlight group card-surface rounded-2xl p-5 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <span className="icon-tile size-8 text-primary">
                  {s.icon}
                </span>
              </div>
              <div className="font-mono mt-3 text-2xl font-bold tracking-tight tabular-nums">
                {s.cents != null ? (
                  <AnimatedCents
                    value={s.cents}
                    className="font-mono text-2xl font-bold tracking-tight tabular-nums"
                  />
                ) : s.value != null ? (
                  s.value.toLocaleString()
                ) : (
                  "—"
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-0.5 w-8 rounded-full bg-primary" />
                <span className="font-label text-[9px] uppercase tracking-wide text-muted-foreground/50">
                  {s.foot}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-2xl text-center">
          <motion.p variants={fadeUp} className="eyebrow justify-center">
            Simple mechanics, honestly priced
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="type-display mt-4 text-balance"
          >
            Three ways to move the board
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-base leading-relaxed text-muted-foreground">
            Star for free. Boost with real money. Or pay to move a rival down. Every action lands on a public receipt.
          </motion.p>
        </motion.div>
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          {[
            {
              emoji: "⭐",
              kicker: "Free",
              title: "Star it",
              mono: "+$0.10 credit per star",
              body: "Anyone can star any ranked product. Every star adds $0.10 of rank credit — the crowd's signal, counted in real money terms.",
            },
            {
              emoji: "🚀",
              kicker: "Paid",
              title: "Boost yours",
              mono: "5× the leader banks 3h of lock",
              body: "Every dollar you boost adds straight to your total. Drop 5x the leader's bank in one hit and your #1 spot locks for 3 hours.",
            },
            {
              emoji: "👎",
              kicker: "Paid",
              title: "Down-rank rivals",
              mono: "2× the target's banked total",
              body: "Sabotage costs double their banked total — and every dollar drags their rank straight down. They can boost back. War.",
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -3, transition: springSnappy }}
              onPointerMove={trackSpotlight}
              className="spotlight group rounded-2xl border border-border/50 bg-card shadow-apple p-6 transition-[box-shadow,border-color,transform] duration-300 hover:border-primary/30 hover:shadow-apple-hover glow-hover"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-primary/8 text-xl leading-none transition-colors group-hover:bg-primary/15">
                  {f.emoji}
                </span>
                <span
                  className={cn(
                    "font-label rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide",
                    f.kicker === "Paid"
                      ? "border-[color-mix(in_oklab,var(--flame)_35%,transparent)] bg-[color-mix(in_oklab,var(--flame)_8%,transparent)] text-accent-orange"
                      : "border-border/60 text-muted-foreground/70",
                  )}
                >
                  {f.kicker}
                </span>
              </div>
              <h3 className="font-display mt-4 text-base font-bold leading-snug">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
              <div className="mt-4 flex items-center gap-1.5 border-t border-border/40 pt-3">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                  {f.mono}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How rank works — the mechanics, in public */}
      <section className="border-b border-border/50 bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.p
              variants={fadeUp}
              className="eyebrow"
            >
              The mechanics
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="type-display mt-3"
            >
              How rank works.
            </motion.h2>

            {/* The formula, as an editorial pull-quote */}
            <motion.div
              variants={fadeUp}
              className="bg-ink mt-8 overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-10"
            >
              <p className="font-label text-[10px] uppercase tracking-widest text-background/50">
                The only formula that matters
              </p>
              <p className="font-mono mt-4 text-xl font-bold leading-snug text-background sm:text-2xl">
                <span className="text-background">rank</span>
                <span className="text-primary"> = </span>
                <span className="text-emerald-400">💵 money banked</span>
                <span className="text-primary"> + </span>
                <span className="text-amber-300">⭐ stars</span>
                <span className="text-primary"> + </span>
                <span className="text-sky-300">🤝 invites</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {[
                  "every dollar = 1 receipt",
                  "star = +$0.10 credit",
                  "invite = +$2 credit",
                  "ties favor earlier entry",
                ].map((t) => (
                  <span
                    key={t}
                    className="font-label rounded-full border border-background/15 bg-background/5 px-2.5 py-1 text-[9px] uppercase tracking-wide text-background/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Numbered rules */}
            <motion.ol
              variants={stagger(0.08)}
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {RANK_RULES.map((r) => (
                <motion.li
                  key={r.step}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: springSnappy }}
                  onPointerMove={trackSpotlight}
                  className="spotlight group rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-card-hover glow-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono grid size-9 shrink-0 place-items-center rounded-full border border-border/60 bg-secondary/40 text-sm font-bold tabular-nums text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                      {r.step}
                    </span>
                    <span className="h-px flex-1 bg-border/40" />
                  </div>
                  <h3 className="font-display mt-3 text-sm font-bold">{r.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {r.body}
                  </p>
                </motion.li>
              ))}
            </motion.ol>

            <motion.p
              variants={fadeUp}
              className="font-label mt-6 text-center text-[11px] text-muted-foreground"
            >
              credits climb ranks but can't lock #1 or fund a retake — those
              take real money
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Social profiles highlight */}
      <section className="border-b border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.p
              variants={fadeUp}
              className="font-label flex items-center gap-2 text-xs font-medium text-primary"
            >
              <span className="inline-block size-2 rounded-full bg-primary" />
              Not just products
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="type-display mt-3"
            >
              Rank your social profiles, too.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base"
            >
              Submit your X, YouTube, Instagram, TikTok, LinkedIn, Twitch, or
              Substack profile — or list your game, podcast, real estate, or
              creative project. Creators compete for visibility the same way
              products do.
            </motion.p>

            <motion.div
              variants={stagger(0.03)}
              className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {[
                { id: "x-profiles", emoji: "𝕏", label: "X / Twitter" },
                { id: "yt-channels", emoji: "📺", label: "YouTube" },
                { id: "instagram", emoji: "📸", label: "Instagram" },
                { id: "tiktok", emoji: "🎵", label: "TikTok" },
                { id: "linkedin", emoji: "💼", label: "LinkedIn" },
                { id: "twitch", emoji: "🎮", label: "Twitch" },
                { id: "newsletters", emoji: "✉️", label: "Newsletters" },
                { id: "games", emoji: "🕹️", label: "Games" },
                { id: "audio", emoji: "🎙️", label: "Podcasts" },
                { id: "design", emoji: "🎨", label: "Design" },
                { id: "writing", emoji: "✍️", label: "Writing" },
                { id: "ai-media", emoji: "✨", label: "AI Media" },
                { id: "realestate", emoji: "🏠", label: "Real Estate" },
              ].map((s) => (
                <motion.div key={s.id} variants={fadeUp} whileHover={{ y: -3, transition: springSnappy }}>
                  <Link
                    to={`/board?category=${s.id}`}
                    onPointerMove={trackSpotlight}
                    className="spotlight group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-card-hover glow-hover"
                  >
                    <span className="icon-tile size-9 overflow-hidden text-sm leading-none">{s.emoji}</span>
                    <span className="text-[13px] font-semibold">{s.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <BoardsSection />

      {/* Next Unicorn — startup idea validation */}
      <NextUnicorn />

      {/* Referral leaderboard — the recruiters */}
      <section className="bg-ink border-y border-foreground/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <motion.p
                  variants={fadeUp}
                  className="font-label flex items-center gap-2 text-xs font-medium text-primary"
                >
                  <span className="inline-block size-2 rounded-full bg-primary" />
                  The recruiters
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="type-display mt-3 text-background"
                >
                  Top inviters.
                </motion.h2>
              </div>
              <motion.p
                variants={fadeUp}
                className="font-label flex items-center gap-2 text-[11px] text-background/60"
              >
                <Users className="size-3.5" />
                +$2 RANK CREDIT PER SIGNUP
              </motion.p>
            </div>

            {topReferrers === undefined ? (
              <div className="font-label mt-10 text-sm text-background/40">
                Loading the recruiter board…
              </div>
            ) : topReferrers.length === 0 ? (
              <motion.div
                variants={fadeUp}
                className="mt-10 rounded-xl border border-background/15 bg-background/5 px-6 py-10 text-center"
              >
                <p className="font-display text-lg font-bold text-background">
                  Nobody has recruited yet.
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-background/60">
                  The first invites are the cheapest rank you'll ever get — each
                  signup adds $2 of credit to your best listing.
                </p>
              </motion.div>
            ) : (
              <motion.ol
                variants={stagger(0.06)}
                className="mt-8 overflow-hidden rounded-xl border border-background/15"
              >
                {topReferrers.map((r) => (
                  <motion.li
                    key={r.rank}
                    variants={fadeUp}
                    whileHover={{ x: 4, transition: springSnappy }}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      r.rank % 2 === 1 ? "bg-background/5" : ""
                    }`}
                  >
                    <span className="font-display w-8 shrink-0 text-lg font-black text-background/40">
                      {String(r.rank).padStart(2, "0")}
                    </span>
                    {r.rank <= 3 && (
                      <Medal
                        className={`size-4 shrink-0 ${
                          r.rank === 1
                            ? "text-primary"
                            : r.rank === 2
                              ? "text-background/70"
                              : "text-background/40"
                        }`}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-background">
                      {r.name}
                    </span>
                    <span className="font-label shrink-0 text-[11px] text-background/60">
                      {r.referralCount} {r.referralCount === 1 ? "invite" : "invites"}
                    </span>
                    <span className="font-mono w-20 shrink-0 text-right text-sm font-bold tabular-nums text-primary">
                      +{formatCents(r.creditCents)}
                    </span>
                  </motion.li>
                ))}
              </motion.ol>
            )}

            <motion.div variants={fadeUp} className="mt-8 text-center">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/auth?returnTo=%2Fdashboard">
                  Get your invite link
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="font-label mt-3 text-[11px] text-background/50">
                one referral per person · credit lands on your most-banked
                listing automatically
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA — boarding pass */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <BoardingPass
            serial="000042"
            title={
              <h2 className="type-display">
                Your rival already listed. What are you waiting for?
              </h2>
            }
            body={
              <p className="mx-auto max-w-md text-muted-foreground">
                $5 to list. Boosts from $5.{" "}
                <span className="text-accent-orange font-medium">#1</span> only
                means something because someone paid for it.
              </p>
            }
            actions={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Claim your spot
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/board">Lurk the boards</Link>
                </Button>
              </div>
            }
          />
        </motion.div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row">
          <span className="font-label">Atlas AI — a considered index of what's worth your time.</span>
          <CoordinatesTicker />
          <span className="hidden lg:inline">Stars & referrals climb free · boosts & sabotages are forever</span>
        </div>
      </footer>
    </div>
  );
}
