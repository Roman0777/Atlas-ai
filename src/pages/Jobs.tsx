import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SalaryBidDialog } from "@/components/salary-bid-dialog";
import { api } from "@/convex/_generated/api";
import { EASE, fadeUp, springSnappy, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAction, useQuery } from "convex/react";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Clock,
  Coins,
  ExternalLink,
  Globe,
  Gavel,
  MapPin,
  RefreshCw,
  Rocket,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const SOURCE_META: Record<string, { label: string; color: string }> = {
  jsearch: { label: "LinkedIn · Indeed · Glassdoor", color: "bg-blue-500/10 text-blue-600" },
  remotive: { label: "Remotive", color: "bg-green-500/10 text-green-600" },
  arbeitnow: { label: "Arbeitnow", color: "bg-purple-500/10 text-purple-600" },
};

const CATEGORY_FILTERS = [
  { value: "", label: "All roles" },
  { value: "Software Development", label: "Engineering" },
  { value: "Design", label: "Design" },
  { value: "Data Science", label: "Data" },
  { value: "Product", label: "Product" },
  { value: "Marketing", label: "Marketing" },
  { value: "DevOps / Sysadmin", label: "DevOps" },
  { value: "Customer Service", label: "Support" },
];

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) =>
    `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<boolean | undefined>(undefined);
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");

  const jobs = useQuery(api.jobsQuery.searchJobs, {
    q: query || undefined,
    remote: remote ?? undefined,
    category: category || undefined,
    source: source || undefined,
  });
  const stats = useQuery(api.jobsQuery.getJobStats);
  const syncMeta = useQuery(api.jobsQuery.getSyncMeta);
  const bidSummary = useQuery(api.salaryBids.getBidSummary);
  const refreshAction = useAction(api.jobs.refreshJobs);

  // Salary bid dialog state
  const [bidJob, setBidJob] = useState<null | { id: string; title: string; company: string }>(null);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await refreshAction();
      const total = result.reduce((s, r) => s + r.count, 0);
      toast.success(`Fetched ${total} jobs from ${result.length} sources.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshAction]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(() => {
      refreshAction().catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [refreshAction]);

  const lastSync = useMemo(() => {
    if (!syncMeta || syncMeta.length === 0) return null;
    return syncMeta.reduce((latest, m) =>
      m.lastSyncAt > latest.lastSyncAt ? m : latest,
    );
  }, [syncMeta]);

  const totalJobs = stats?.total ?? 0;
  const remoteJobs = stats?.remoteCount ?? 0;

  return (
    <div className="min-h-screen bg-background">
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
              Jobs & Careers
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="type-display-lg mt-4"
            >
              Find your next role.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              Aggregated from LinkedIn, Indeed, Glassdoor, Remotive, and
              Arbeitnow. Updated automatically. Apply directly.
            </motion.p>
          </motion.div>

          {/* Stats strip */}
          {stats && (
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Badge variant="secondary" className="gap-1.5">
                <Zap className="size-3" />
                {totalJobs.toLocaleString()} jobs
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Globe className="size-3" />
                {remoteJobs.toLocaleString()} remote
              </Badge>
              {lastSync && (
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <Clock className="size-3" />
                  Updated {timeAgo(lastSync.lastSyncAt)}
                </Badge>
              )}
              {stats.bySource &&
                Object.entries(stats.bySource).map(([src, count]) => {
                  const meta = SOURCE_META[src];
                  return (
                    <Badge
                      key={src}
                      variant="outline"
                      className={cn("gap-1.5 text-xs", meta?.color)}
                    >
                      {meta?.label ?? src}: {count}
                    </Badge>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Search + filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, company, or location…"
              className="pl-9"
            />
          </div>

          <div className="flex gap-1 rounded-full border border-border/60 bg-card p-1 shadow-apple">
            {[
              { val: undefined, label: "All", icon: null },
              { val: true, label: "Remote", icon: Globe },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setRemote(opt.val)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  remote === opt.val
                    ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-3px_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10 rounded-full border border-border/60 bg-card px-4 text-xs font-medium shadow-apple outline-none transition-colors hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">All sources</option>
            <option value="jsearch">LinkedIn · Indeed · Glassdoor</option>
            <option value="remotive">Remotive</option>
            <option value="arbeitnow">Arbeitnow</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-full border border-border/60 bg-card px-4 text-xs font-medium shadow-apple outline-none transition-colors hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {CATEGORY_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Fetching…" : "Refresh"}
          </Button>
        </div>

        {/* Job listings */}
        {!jobs ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card shadow-apple p-16 text-center">
            <p className="type-heading">
              {query ? `No results for "${query}"` : "No jobs loaded yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? "Try a different search or broaden your filters."
                : "Click Refresh above to fetch the latest listings from all sources."}
            </p>
            {!query && (
              <Button onClick={onRefresh} className="mt-4 gap-2" disabled={refreshing}>
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                Fetch jobs now
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job, i) => (
              <motion.li
                key={job._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(i * 0.03, 0.3),
                  ease: EASE,
                }}
                whileHover={{ y: -2, transition: springSnappy }}
                className="group rounded-2xl border border-border/50 bg-card p-5 shadow-apple transition-[box-shadow,border-color,transform] duration-300 hover:border-primary/40 hover:shadow-apple-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="font-display truncate text-[15px] font-semibold tracking-tight">
                        {job.title}
                      </h3>
                      {job.isRemote && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Globe className="size-3" /> Remote
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          SOURCE_META[job.source]?.color,
                        )}
                      >
                        {SOURCE_META[job.source]?.label ?? job.source}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {job.companyName}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {job.location}
                        </span>
                      )}
                      {job.salaryMin || job.salaryMax ? (
                        <span className="font-mono font-semibold text-foreground">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>
                      ) : null}
                      {job.postedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {timeAgo(job.postedAt)}
                        </span>
                      )}
                    </div>

                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {/* Salary bid count */}
                    {bidSummary?.[job._id] && (
                      <button
                        type="button"
                        onClick={() => setBidJob({ id: job._id, title: job.title, company: job.companyName })}
                        className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <Gavel className="size-3" />
                        {bidSummary[job._id].count} bid{bidSummary[job._id].count !== 1 ? "s" : ""}
                        <span className="text-[10px] text-muted-foreground">
                          from ${bidSummary[job._id].topSalary.toLocaleString()}
                        </span>
                      </button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setBidJob({ id: job._id, title: job.title, company: job.companyName })}
                      >
                        <Gavel className="size-3" />
                        Bid Salary
                      </Button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground"
                        >
                          Apply
                          <ExternalLink className="size-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        {jobs && jobs.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing {jobs.length} jobs · Sources update every 5 minutes ·{" "}
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

      {/* Salary bid dialog */}
      {bidJob && (
        <SalaryBidDialog
          jobId={bidJob.id}
          jobTitle={bidJob.title}
          companyName={bidJob.company}
          isOpen={true}
          onClose={() => setBidJob(null)}
        />
      )}

      {/* Salary bidding explainer */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            {/* For candidates */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Gavel className="size-6 text-primary" />
              </div>
              <h2 className="type-heading">Bid your salary.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Found a job you love? Bid the salary you want. Lower bids win —
                employers pick the best candidate. Pay to boost your bid above others.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <Coins className="size-3.5" /> Free to bid
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <Rocket className="size-3.5" /> $1 to boost
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <Trophy className="size-3.5" /> Lowest bid wins
                </span>
              </div>
            </div>
            {/* For employers */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="size-6 text-primary" />
              </div>
              <h2 className="type-heading">Hire the best.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                List your opening and watch candidates bid their salary.
                Pick the one that fits. Pay $2 to list, $5 to boost visibility.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <ClipboardList className="size-3.5" /> $2 to list
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <TrendingUp className="size-3.5" /> $5 to boost
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <Target className="size-3.5" /> Pick your hire
                </span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth?returnTo=%2Fboard">
                List a job — $2
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/board">Back to leaderboards</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
