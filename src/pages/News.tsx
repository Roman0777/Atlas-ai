import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import { EASE, fadeUp, stagger } from "@/lib/motion";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useAction } from "convex/react";
import { motion, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  Newspaper,
  RefreshCw,
  Rss,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { NewsSkeleton } from "@/components/skeleton";

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Integer value that glides to its target — stats feel live, not static. */
function AnimatedCount({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 120, damping: 22 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span>{text}</motion.span>;
}

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sourceKey, setSourceKey] = useState("");
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const news = useQuery(api.newsQuery.listNews, {
    category: category || undefined,
    sourceKey: sourceKey || undefined,
    limit: 80,
  });
  const stats = useQuery(api.newsQuery.getNewsStats);
  const syncMeta = useQuery(api.newsQuery.getNewsSyncMeta);
  const digest = useQuery(api.newsQuery.getDigest);
  const subscriberCount = useQuery(api.newsletter.getSubscriberCount);
  const refreshAction = useAction(api.news.refreshNews);
  const subscribe = useMutation(api.newsletter.subscribeNewsletter);
  const confirmSubscription = useMutation(
    api.newsletter.confirmSubscription,
  );

  // Double opt-in: consume ?confirm=<token> links from the email.
  const confirmToken = searchParams.get("confirm");
  useEffect(() => {
    if (!confirmToken) return;
    confirmSubscription({ token: confirmToken })
      .then((result) => {
        if (result === "confirmed") {
          toast.success("Subscription confirmed — welcome aboard!");
        } else if (result === "already_confirmed") {
          toast.info("You're already subscribed.");
        } else {
          toast.error("That confirmation link is no longer valid.");
        }
      })
      .catch(() => toast.error("Couldn't confirm your subscription."))
      .finally(() => {
        setSearchParams({}, { replace: true });
      });
  }, [confirmToken, confirmSubscription, setSearchParams]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshAction({});
      const total = result.reduce((s, r) => s + r.count, 0);
      toast.success(`Fetched ${total} stories from ${result.length} sources.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribing) return;
    setSubscribing(true);
    try {
      const result = await subscribe({ email });
      if (result === "already_subscribed") {
        toast.info("You're already on the list.");
      } else {
        toast.success("Check your inbox to confirm your subscription.");
        setEmail("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscribe failed.");
    } finally {
      setSubscribing(false);
    }
  };

  const filtered = useMemo(() => {
    if (!news) return undefined;
    if (!query) return news;
    const q = query.toLowerCase();
    return news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.sourceName.toLowerCase().includes(q),
    );
  }, [news, query]);

  const lastSync = useMemo(() => {
    if (!syncMeta || syncMeta.length === 0) return null;
    return syncMeta.reduce((latest, m) =>
      m.lastSyncAt > latest.lastSyncAt ? m : latest,
    );
  }, [syncMeta]);

  const activeCategories = useMemo(() => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count, meta: getCategory(id) }))
      .filter((c) => c.meta);
  }, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="news" />

      {/* Hero */}
      <section className="border-b border-border/50 bg-ledger grain">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-14">
          <motion.div
            variants={stagger(0.06, 0.05)}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              className="eyebrow"
            >
              The Atlas Dispatch
            </motion.p>
            <motion.h1 variants={fadeUp} className="type-display mt-3">
              Every story. One front page.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base"
            >
              Publisher-owned RSS feeds — TechCrunch, HN, arXiv, Cloudflare,
              CoinDesk and more — synced into every Atlas category. Read the
              source, always.
            </motion.p>
          </motion.div>

          {/* Stats strip */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Newspaper className="size-3" />
              <AnimatedCount value={stats?.total ?? 0} /> stories
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Rss className="size-3" />
              {Object.keys(stats?.bySource ?? {}).length} live sources
            </Badge>
            {typeof subscriberCount === "number" && (
              <Badge variant="secondary" className="gap-1.5">
                <Mail className="size-3" />
                <AnimatedCount value={subscriberCount} /> subscribers
              </Badge>
            )}
            {lastSync && (
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Clock className="size-3" />
                Synced {timeAgo(lastSync.lastSyncAt)}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1.5 rounded-full px-2.5 text-xs"
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw className={cn("size-3", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Digest rail: top story per category */}
        {digest && digest.length > 0 && (
          <section className="mb-10">
            <h2 className="type-heading mb-3">Across the board</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {digest.slice(0, 9).map((item) => (
                <a
                  key={item._id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-border/50 bg-card p-4 shadow-apple transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-apple-hover"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {getCategory(item.category)?.emoji}{" "}
                    {getCategory(item.category)?.label ?? item.category}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {item.sourceName} · {timeAgo(item.publishedAt)}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Search + filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headlines…"
              className="pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-full border border-border/60 bg-card px-4 text-xs font-medium shadow-apple outline-none transition-colors hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">All categories</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.meta?.emoji} {c.meta?.label} ({c.count})
              </option>
            ))}
          </select>
          <select
            value={sourceKey}
            onChange={(e) => setSourceKey(e.target.value)}
            className="h-10 rounded-full border border-border/60 bg-card px-4 text-xs font-medium shadow-apple outline-none transition-colors hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">All sources</option>
            {Object.entries(stats?.bySource ?? {})
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <option key={key} value={key}>
                  {key} ({count})
                </option>
              ))}
          </select>
        </div>

        {/* Story list */}
        {filtered === undefined ? (
          <NewsSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-14 text-center shadow-apple">
            <Globe className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No stories match.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search, or hit Refresh to pull the latest feeds.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item, i) => {
              const cat = getCategory(item.category);
              return (
                <motion.li
                  key={item._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: EASE,
                    delay: Math.min(i * 0.02, 0.3),
                  }}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-apple transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-apple-hover"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        className="hidden size-20 shrink-0 rounded-lg object-cover sm:block"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {item.sourceName}
                        </span>
                        <span>·</span>
                        <span>
                          {cat?.emoji} {cat?.label ?? item.category}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(item.publishedAt)}</span>
                      </div>
                      <h3 className="mt-1 font-medium leading-snug group-hover:text-primary">
                        {item.title}
                        <ExternalLink className="ml-1.5 inline size-3.5 opacity-0 transition group-hover:opacity-60" />
                      </h3>
                      {item.summary && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </a>
                </motion.li>
              );
            })}
          </ul>
        )}

        {news && news.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing {filtered?.length ?? 0} of {stats?.total ?? 0} stories ·
            Feeds sync automatically ·{" "}
            <button
              type="button"
              onClick={onRefresh}
              className="text-primary hover:underline"
            >
              Refresh now
            </button>
          </p>
        )}
      </main>

      {/* Newsletter sign-up */}
      <section
        id="newsletter"
        className="scroll-mt-20 border-t border-border/60 bg-card/40"
      >
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <h2 className="type-heading">The weekly Dispatch.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            One email, the best story from every board. No spam, unsubscribe
            anytime — double opt-in via confirmation link.
          </p>
          <form
            onSubmit={onSubscribe}
            className="mx-auto mt-6 flex max-w-md gap-2"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1"
            />
            <Button type="submit" disabled={subscribing} className="gap-2">
              <Send className="size-4" />
              {subscribing ? "Signing up…" : "Subscribe"}
            </Button>
          </form>
          {typeof subscriberCount === "number" && subscriberCount > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              {subscriberCount.toLocaleString()} founders already subscribed
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href="/board">
                Explore leaderboards
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
