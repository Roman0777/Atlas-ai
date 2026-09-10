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
import { CategoryIcon } from "@/components/category-icon";
import { REFERRAL_CREDIT_CENTS, STAR_CREDIT_CENTS } from "@/lib/categories";
import { CATEGORIES, formatCents, getCategory } from "@/lib/categories";
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
  Rocket,
  Star,
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
  { rank: 1, title: "Nebula Copilot", cat: "ai-tools", paid: 4120, locked: true },
  { rank: 2, title: "Shipfast.dev", cat: "saas", paid: 2860, locked: false },
  { rank: 3, title: "TabWrangler", cat: "extensions", paid: 1930, locked: false },
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
      className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {filtered.map((c) => {
        const leader = leaderMap.get(c.id);
        const fav = faviconUrl(leader?.leaderUrl ?? null);
        return (
          <motion.div key={c.id} variants={fadeUp} whileHover={{ y: -2, transition: springSnappy }}>
            <Link
              to={`/board?category=${c.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-card-hover"
            >
              <span className="icon-tile size-10 text-primary">
                <CategoryIcon icon={c.icon} className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug">
                  {c.label}
                </span>
                {leader?.leaderTitle ? (
                  <span className="mt-1 flex items-center gap-1.5 text-xs leading-snug text-muted-foreground/60">
                    {fav ? (
                      <img
                        src={fav}
                        alt=""
                        className="size-3.5 shrink-0 rounded-sm"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="truncate">{leader.leaderTitle}</span>
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-muted-foreground/30">
                    Be the first to list
                  </span>
                )}
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/20 transition-all group-hover:translate-x-1 group-hover:text-primary" />
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
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <p className="font-label flex items-center gap-2 text-xs font-medium text-primary/70">
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              {CATEGORIES.length} boards
            </p>
            <h2 className="type-display-lg mt-4">
              One rule: money talks.
            </h2>
          </div>
          <Link to="/board">
            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-sm">
              View all boards <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </motion.div>

        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORY_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={cn(
                "relative rounded-full px-4 py-2 text-xs font-medium transition-all",
                group === g.id
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
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
      category: "ai-tools",
      growth: "+340%",
    },
    {
      name: "Micro-SaaS Billing OS",
      tagline: "Stripe + usage-based pricing in a box",
      market: "$8.7B",
      traffic: "8.5K/mo",
      competition: "High",
      score: 87,
      category: "saas",
      growth: "+210%",
    },
    {
      name: "Social SEO Analyzer",
      tagline: "Rank your tweets and threads on Google",
      market: "$2.1B",
      traffic: "22K/mo",
      competition: "Low",
      score: 95,
      category: "seo",
      growth: "+520%",
    },
    {
      name: "Founder Finance Copilot",
      tagline: "Cash runway, burn rate, investor-ready reports",
      market: "$6.3B",
      traffic: "5.8K/mo",
      competition: "Medium",
      score: 84,
      category: "bizlegal",
      growth: "+180%",
    },
    {
      name: "AI Meeting Notes → Tasks",
      tagline: "Zoom call to Jira tickets in 30 seconds",
      market: "$3.5B",
      traffic: "15K/mo",
      competition: "High",
      score: 79,
      category: "productivity",
      growth: "+290%",
    },
    {
      name: "One-Click Deploy Marketplace",
      tagline: "Sell your app template, deploy with a click",
      market: "$1.8B",
      traffic: "9.2K/mo",
      competition: "Low",
      score: 91,
      category: "devtools",
      growth: "+410%",
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-5">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-label flex items-center gap-2 text-xs font-medium text-primary/70">
                <span className="inline-block size-1.5 rounded-full bg-primary/60" />
                Idea validation
              </p>
              <h2 className="type-display-lg mt-4">
                The next unicorn starts here.
              </h2>
              <p className="mt-3 max-w-lg text-base text-muted-foreground/70">
                Market size, traffic signals, and competition — ranked by
                validation score. List your idea and let the board decide.
              </p>
            </div>
            <a
              href="/auth?returnTo=%2Fboard"
              className="font-label rounded-full border border-primary/30 px-5 py-2.5 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              Submit your idea →
            </a>
          </motion.div>

          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {ideas.map((idea) => (
              <motion.div
                key={idea.name}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="group rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/70 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/75">
                    <CategoryIcon icon={getCategory(idea.category)?.icon} className="size-3.5" />
                    {getCategory(idea.category)?.label ?? idea.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-label text-[10px] text-muted-foreground/70">SCORE</span>
                    <span className={cn("font-mono text-sm font-bold", idea.score >= 90 ? "text-primary" : idea.score >= 80 ? "text-foreground" : "text-muted-foreground")}>
                      {idea.score}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold leading-snug">
                  {idea.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/60">
                  {idea.tagline}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/30 pt-4">
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/70">MARKET</span>
                    <p className="font-mono text-sm font-semibold">{idea.market}</p>
                  </div>
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/70">TRAFFIC</span>
                    <p className="font-mono text-sm font-semibold">{idea.traffic}</p>
                  </div>
                  <div>
                    <span className="font-label text-[9px] text-muted-foreground/70">GROWTH</span>
                    <p className="font-mono text-sm font-semibold text-primary">{idea.growth}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label text-[9px] text-muted-foreground/70">COMPETITION</span>
                    <span className={cn("text-[10px] font-medium", idea.competition === "Low" ? "text-green-600 dark:text-green-400" : idea.competition === "Medium" ? "text-yellow-600 dark:text-yellow-400" : "text-red-500 dark:text-red-400")}>
                      {idea.competition}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary/40">
                    <div
                      className={cn("h-full rounded-full transition-all", idea.competition === "Low" ? "bg-green-500/50 w-1/3" : idea.competition === "Medium" ? "bg-yellow-500/50 w-2/3" : "bg-red-400/50 w-full")}
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
            <span className="grid size-7 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
              AI
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
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
            <Button asChild size="sm" className="rounded-full text-xs">
              <Link to="/auth?returnTo=%2Fdashboard">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero — cinematic, full viewport */}
      <section className="bg-mesh-gradient relative flex min-h-screen items-center overflow-hidden pt-24">
        <CompassRose className="pointer-events-none absolute -left-32 -top-32 size-96 text-foreground opacity-[0.04]" />
        <Particles count={15} />
        <WireframeGlobe className="absolute -right-40 top-1/2 -translate-y-1/2 opacity-80 lg:right-[8%]" />
        <FluidOrbs />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <motion.div
            variants={stagger(0.09, 0.05)}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              className="font-label mb-6 flex items-center gap-2 text-xs font-medium text-primary/70"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              Atlas AI
            </motion.p>
            <h1 className="type-display-lg leading-[0.95]">
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
              className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground/70 sm:text-xl"
            >
              A considered index of AI tools, extensions, servers, research,
              and the people making them worth your time.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-lg text-base text-muted-foreground/75"
            >
              Star what you love free. Boost your own with real dollars — or{" "}
              <span className="text-accent-orange">
                pay to down-rank a rival
              </span>
              . Every position is backed by receipts.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild size="lg" className="group gap-2 rounded-full px-6">
                  <Link to="/board">
                    See the boards
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                  <Link to="/auth?returnTo=%2Fdashboard">List your product</Link>
                </Button>
              </Magnetic>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="font-label mt-6 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/70"
            >
              {["$5 to list", "boosts from $5", "stars free", "invites +$2"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/30 bg-card/40 px-2.5 py-1 backdrop-blur-sm"
                  >
                    {t}
                  </span>
                ),
              )}
            </motion.p>
          </motion.div>

          {/* Mock leaderboard card */}
          <TiltCard className="relative">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
              className="hero-card overflow-hidden rounded-2xl border"
            >
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="icon-tile size-7 text-primary">
                    <Trophy className="size-4" />
                  </span>
                  <span className="font-label text-xs uppercase tracking-wide text-foreground/80">
                    Today's money
                  </span>
                </div>
                <span className="font-label flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wide text-primary/80">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-primary opacity-50" />
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
                <span className="flex-1 font-label text-[9px] uppercase tracking-wide text-muted-foreground/70">
                  product
                </span>
                <span className="pr-1 font-label text-[9px] uppercase tracking-wide text-muted-foreground/70">
                  bank
                </span>
              </div>

              <ul className="divide-y divide-border/20">
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
                    className="flex items-center gap-3 px-5 py-3.5"
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
                          {getCategory(r.cat)?.label ?? r.cat}
                        </span>
                      </p>
                    </div>
                    {r.locked ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-primary/80">
                        <Crown className="size-3" />
                        LOCKED
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-border/30 px-2 py-0.5 font-label text-[9px] uppercase tracking-wide text-muted-foreground/70">
                        open
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">
                      {formatCents(r.paid)}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="flex items-center gap-2 border-t border-border/30 bg-card/30 px-5 py-3">
                <span className="rounded-full border border-border/30 px-2 py-0.5 font-label text-[9px] uppercase tracking-wide text-muted-foreground/70">
                  vs
                </span>
                <p className="flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground/75">
                  <ThumbsDown className="size-3 shrink-0" />
                  Shipfast.dev down-ranked for $50 → #2
                </p>
              </div>
            </motion.div>
          </TiltCard>
        </div>
      </section>

      {/* Category ticker */}
      <div
        aria-hidden
        className="fade-mask-x relative overflow-hidden border-y border-border/20 bg-secondary/20 py-4"
      >
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <span
              key={i}
              className="font-label flex items-center gap-3 px-5 text-xs text-muted-foreground/70"
            >
              <span className="icon-tile size-6 text-primary">
                <CategoryIcon icon={c.icon} className="size-3.5" />
              </span>
              {c.label}
              <span className="text-primary/40">·</span>
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
              icon: <Star className="size-5" />,
              kicker: "Free",
              title: "Star it",
              mono: "+$0.10 credit per star",
              body: "Anyone can star any ranked product. Every star adds $0.10 of rank credit — the crowd's signal, counted in real money terms.",
            },
            {
              icon: <Rocket className="size-5" />,
              kicker: "Paid",
              title: "Boost yours",
              mono: "5× the leader banks 3h of lock",
              body: "Every dollar you boost adds straight to your total. Drop 5x the leader's bank in one hit and your #1 spot locks for 3 hours.",
            },
            {
              icon: <ThumbsDown className="size-5" />,
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
                <span className="grid size-11 place-items-center rounded-full bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                  {f.icon}
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
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p
              variants={fadeUp}
              className="eyebrow"
            >
              The mechanics
            </motion.p>
            <h2 className="type-display-lg mt-4">
              How rank works.
            </h2>

            <motion.div
              variants={fadeUp}
              className="bg-ink mt-10 overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16"
            >
              <p className="font-label text-[10px] uppercase tracking-widest text-background/30">
                The only formula that matters
              </p>
              <p className="font-mono mt-5 text-xl font-bold leading-sug text-background sm:text-2xl">
                <span className="text-background/80">rank</span>
                <span className="text-primary"> = </span>
                <span className="text-emerald-400">money banked</span>
                <span className="text-primary"> + </span>
                <span className="text-amber-300">stars</span>
                <span className="text-primary"> + </span>
                <span className="text-sky-300">invites</span>
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {[
                  "every dollar = 1 receipt",
                  "star = +$0.10 credit",
                  "invite = +$2 credit",
                  "ties favor earlier entry",
                ].map((t) => (
                  <span
                    key={t}
                    className="font-label rounded-full border border-background/10 bg-background/5 px-3 py-1.5 text-[9px] uppercase tracking-wide text-background/40"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.ol
              variants={stagger(0.08)}
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {RANK_RULES.map((r) => (
                <motion.li
                  key={r.step}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: springSnappy }}
                  onPointerMove={trackSpotlight}
                  className="spotlight group rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/60 hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono grid size-10 shrink-0 place-items-center rounded-full border border-border/30 bg-secondary/20 text-sm font-bold tabular-nums text-primary/70 transition-colors group-hover:border-primary/30 group-hover:bg-primary/8">
                      {r.step}
                    </span>
                    <span className="h-px flex-1 bg-border/20" />
                  </div>
                  <h3 className="font-display mt-4 text-sm font-bold">{r.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground/60">
                    {r.body}
                  </p>
                </motion.li>
              ))}
            </motion.ol>

            <p className="font-label mt-8 text-center text-[11px] text-muted-foreground/70">
              credits climb ranks but can't lock #1 or fund a retake — those
              take real money
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social profiles */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <p className="font-label flex items-center gap-2 text-xs font-medium text-primary/70">
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              Not just products
            </p>
            <h2 className="type-display-lg mt-4">
              Rank your social profiles, too.
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground/60">
              Submit your X, YouTube, Instagram, TikTok, LinkedIn, Twitch, or
              Substack profile — or list your game, podcast, real estate, or
              creative project. Creators compete for visibility the same way
              products do.
            </p>

            <motion.div
              variants={stagger(0.03)}
              className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {[
                { id: "x-profiles", label: "X / Twitter" },
                { id: "yt-channels", label: "YouTube" },
                { id: "instagram", label: "Instagram" },
                { id: "tiktok", label: "TikTok" },
                { id: "linkedin", label: "LinkedIn" },
                { id: "twitch", label: "Twitch" },
                { id: "newsletters", label: "Newsletters" },
                { id: "games", label: "Games" },
                { id: "audio", label: "Podcasts" },
                { id: "design", label: "Design" },
                { id: "writing", label: "Writing" },
                { id: "ai-media", label: "AI Media" },
                { id: "realestate", label: "Real Estate" },
              ].map((s) => (
                <motion.div key={s.id} variants={fadeUp} whileHover={{ y: -3, transition: springSnappy }}>
                  <Link
                    to={`/board?category=${s.id}`}
                    onPointerMove={trackSpotlight}
                    className="spotlight group flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/60 hover:shadow-card-hover"
                  >
                    <span className="icon-tile size-9 text-primary"><CategoryIcon category={s.id} className="size-4" /></span>
                    <span className="text-[13px] font-semibold">{s.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <BoardsSection />

      <NextUnicorn />

      {/* Referral leaderboard */}
      <section className="bg-ink relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-label flex items-center gap-2 text-xs font-medium text-primary/70">
                  <span className="inline-block size-1.5 rounded-full bg-primary/60" />
                  The recruiters
                </p>
                <h2 className="type-display mt-4 text-background">
                  Top inviters.
                </h2>
              </div>
              <p className="font-label flex items-center gap-2 text-[11px] text-background/30">
                <Users className="size-3.5" />
                +$2 RANK CREDIT PER SIGNUP
              </p>
            </div>

            {topReferrers === undefined ? (
              <div className="font-label mt-12 text-sm text-background/20">
                Loading the recruiter board…
              </div>
            ) : topReferrers.length === 0 ? (
              <motion.div
                variants={fadeUp}
                className="mt-12 rounded-2xl border border-background/10 bg-background/3 px-8 py-14 text-center"
              >
                <p className="font-display text-xl font-bold text-background">
                  Nobody has recruited yet.
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-background/30">
                  The first invites are the cheapest rank you'll ever get — each
                  signup adds $2 of credit to your best listing.
                </p>
              </motion.div>
            ) : (
              <motion.ol
                variants={stagger(0.06)}
                className="mt-10 overflow-hidden rounded-2xl border border-background/10"
              >
                {topReferrers.map((r) => (
                  <motion.li
                    key={r.rank}
                    variants={fadeUp}
                    whileHover={{ x: 4, transition: springSnappy }}
                    className={cn("flex items-center gap-4 px-6 py-4", r.rank % 2 === 1 ? "bg-background/3" : "")}
                  >
                    <span className="font-display w-8 shrink-0 text-lg font-black text-background/20">
                      {String(r.rank).padStart(2, "0")}
                    </span>
                    {r.rank <= 3 && (
                      <Medal
                        className={cn("size-4 shrink-0", r.rank === 1 ? "text-primary" : r.rank === 2 ? "text-background/40" : "text-background/20")}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-background">
                      {r.name}
                    </span>
                    <span className="font-label shrink-0 text-[11px] text-background/30">
                      {r.referralCount} {r.referralCount === 1 ? "invite" : "invites"}
                    </span>
                    <span className="font-mono w-20 shrink-0 text-right text-sm font-bold tabular-nums text-primary">
                      +{formatCents(r.creditCents)}
                    </span>
                  </motion.li>
                ))}
              </motion.ol>
            )}

            <motion.div variants={fadeUp} className="mt-10 text-center">
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
              <p className="font-label mt-4 text-[11px] text-background/25">
                one referral per person · credit lands on your most-banked
                listing automatically
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA — boarding pass */}
      <section className="mx-auto max-w-6xl px-5 py-28 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <BoardingPass
            serial="000042"
            title={
              <h2 className="type-display-lg">
                Your rival already listed. What are you waiting for?
              </h2>
            }
            body={
              <p className="mx-auto max-w-lg text-muted-foreground/60">
                $5 to list. Boosts from $5.{" "}
                <span className="text-accent-orange font-medium">#1</span> only
                means something because someone paid for it.
              </p>
            }
            actions={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="gap-2 rounded-full">
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Claim your spot
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/board">Lurk the boards</Link>
                </Button>
              </div>
            }
          />
        </motion.div>
      </section>

      <footer className="border-t border-border/20 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 text-xs text-muted-foreground/70 sm:flex-row">
          <span className="font-label">Atlas AI — a considered index of what's worth your time.</span>
          <CoordinatesTicker />
          <span className="hidden lg:inline">Stars & referrals climb free · boosts & sabotages are forever</span>
        </div>
      </footer>
    </div>
  );
}
