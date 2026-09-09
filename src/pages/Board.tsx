import { AnimatedCents } from "@/components/animated-number";
import { StatCard } from "@/components/animated-counter";
import { AtlasGlobeShowcaseLazy as GlobeShowcase } from "@/components/atlas-globe-lazy";
import {
  ListingDetailDialog,
  PayDialog,
} from "@/components/listing-dialogs";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  CATEGORIES,
  formatCents,
  getCategory,
  SABOTAGE_MULTIPLIER,
  STAR_CREDIT_CENTS,
} from "@/lib/categories";
import { springSnappy } from "@/lib/motion";
import { fireConfetti } from "@/lib/confetti";
import { BoardSkeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import {
  Crown,
  ExternalLink,
  Flame,
  HandCoins,
  Star,
  ThumbsDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

type Listing = {
  _id: string;
  ownerId: string;
  title: string;
  url: string;
  tagline?: string;
  category: string;
  totalPaid: number;
  starCount: number;
  referralCreditCents?: number;
  isLocked: boolean;
  rank: number;
  ownerName?: string;
  featured?: boolean;
  featuredUntil?: number;
};

export default function Board() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const category = params.get("category");
  const mode = params.get("range") === "today" ? "today" : "all";
  const { isAuthenticated } = useAuth();

  const board = useQuery(api.listings.getBoard, {
    ...(category ? { category } : {}),
    ...(mode === "today" ? { mode } : {}),
  });
  const mine = useQuery(api.listings.getMine);
  const myStars = useQuery(api.listings.getMyStars);
  const stats = useQuery(api.listings.getStats);
  const activity = useQuery(api.listings.getActivity) ?? [];
  const leaders = useQuery(api.listings.getCategoryLeaders);

  // Seed demo content on first visit (no-ops if any listing exists).
  const ensureSeed = useMutation(api.seed.ensureSeed);
  useEffect(() => {
    void ensureSeed().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accept ?ref=CODE referrals once the visitor signs in.
  const claimReferral = useMutation(api.referrals.claimReferral);
  useEffect(() => {
    const ref = params.get("ref");
    if (!ref || !isAuthenticated) return;
    claimReferral({ code: ref })
      .then((r) => {
        if (r?.applied) {
          toast.success(
            r.creditedTitle
              ? `Referral applied — $2 rank credit added to “${r.creditedTitle}”.`
              : "Referral counted! Credit applies once they list a product.",
          );
        }
        params.delete("ref");
        setParams(params, { replace: true });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Visitor heartbeat for the "N online" badge.
  const trackVisit = useMutation(api.visitors.trackVisit);
  const sessionId = useMemo(() => {
    let id = localStorage.getItem("p2r_sid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("p2r_sid", id);
    }
    return id;
  }, []);
  useEffect(() => {
    const beat = () => trackVisit({ sessionId }).catch(() => {});
    beat();
    const t = setInterval(beat, 60_000);
    return () => clearInterval(t);
  }, [sessionId, trackVisit]);

  const myIds = useMemo(
    () => new Set<string>((mine ?? []).map((l) => String(l._id))),
    [mine],
  );

  // ---- Ticking clock: "featured until" styling must not call Date.now()
  // during render (react-hooks/purity). Starts at 0 (unknown) and ticks. ----
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  // Client-side search filter for the board.
  const [search, setSearch] = useState("");
  const filteredBoard = useMemo(() => {
    if (!board) return board;
    if (!search.trim()) return board;
    const q = search.toLowerCase();
    return board.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.tagline?.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q),
    );
  }, [board, search]);

  // Leader's banked total — anchors the per-row bank-strength bars.
  const leaderTotal = Math.max(1, ...(filteredBoard ?? []).map((l) => l.totalPaid));

  // ---- Rank-change arrows: diff current ranks against the last snapshot ----
  const prevRanksRef = useRef<Map<string, number> | null>(null);
  const clearDeltasRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rankDeltas, setRankDeltas] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    if (!board) return;
    const prev = prevRanksRef.current;
    const snapshot = new Map(board.map((l) => [l._id, l.rank]));
    const changed = new Map<string, number>();
    if (prev) {
      for (const l of board) {
        const before = prev.get(l._id);
        if (before != null && before !== l.rank) {
          changed.set(l._id, before - l.rank); // positive = moved up
        }
      }
    }
    prevRanksRef.current = snapshot;
    if (changed.size > 0) {
      // Deferred to a task — calling setState synchronously in an effect body
      // causes cascading renders (react-hooks/set-state-in-effect).
      const t = setTimeout(() => {
        setRankDeltas(changed);
        clearDeltasRef.current = setTimeout(
          () => setRankDeltas(new Map()),
          3500,
        );
      }, 0);
      return () => {
        clearTimeout(t);
        if (clearDeltasRef.current) clearTimeout(clearDeltasRef.current);
      };
    }
  }, [board]);

  // ---- Live toasts for notable board events ----
  const prevBoardRef = useRef<Listing[] | null>(null);
  useEffect(() => {
    if (!board) return;
    const prev = prevBoardRef.current;
    prevBoardRef.current = board;
    if (!prev) return; // first load, don't toast

    const prevMap = new Map(prev.map((l) => [l._id, l]));
    for (const l of board) {
      const old = prevMap.get(l._id);
      if (!old) continue;
      // New top 3 entrant
      if (l.rank <= 3 && old.rank > 3) {
        toast(`🔥 ${l.title} broke into the top 3!`, { duration: 4000 });
      }
      // Big boost (total jumped by $500+)
      const diff = l.totalPaid - old.totalPaid;
      if (diff >= 50000) {
        // $500+ in cents
        toast(
          `💰 ${l.title} boosted $${Math.round(diff / 100)} — now at $${Math.round(l.totalPaid / 100)}`,
          { duration: 5000 },
        );
      }
    }
  }, [board]);

  // ---- Confetti when the crown changes hands ----
  const leaderId = board?.[0]?._id;
  const prevLeaderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!leaderId) {
      // Board switched category/range — reset so the new board's #1
      // doesn't trigger a false celebration.
      prevLeaderRef.current = null;
      return;
    }
    const prev = prevLeaderRef.current;
    prevLeaderRef.current = leaderId;
    if (prev && prev !== leaderId && board?.[0]) {
      fireConfetti();
      toast.success(`👑 ${board[0].title} just took #1!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderId]);
  const starredIds = useMemo(
    () => new Set<string>((myStars ?? []).map((s) => String(s))),
    [myStars],
  );
  const toggleStar = useMutation(api.listings.toggleStar);

  const [payTarget, setPayTarget] = useState<{
    listing: Listing;
    kind: "boost" | "dislike";
    min?: number;
    hint?: string;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  /** Opens checkout with outbid.lol retake pricing: reclaiming the lead
   *  costs only (top − your total) + $1, not a full re-match. Sabotage
   *  costs double the target's banked total. */
  const openPay = (listing: Listing, kind: "boost" | "dislike") => {
    let min: number | undefined;
    let hint: string | undefined;
    if (kind === "boost" && mode !== "today" && board && board.length > 0) {
      const needed = board[0].totalPaid - listing.totalPaid + 100;
      if (needed > 100) {
        min = Math.max(200, needed);
        hint = `Outbid pricing: retake #1 for just ${formatCents(needed)} — the difference plus $5.`;
      }
    }
    if (kind === "dislike") {
      min = Math.max(200, SABOTAGE_MULTIPLIER * listing.totalPaid);
      hint = `Down-ranking costs double their banked total: ${formatCents(min)}.`;
    }
    setPayTarget({ listing, kind, min, hint });
  };

  // Dodo checkout return handling
  useEffect(() => {
    const payment = params.get("payment");
    if (payment === "success") {
      toast.success("Payment confirmed — the board just moved. 💸");
    } else if (payment === "cancelled") {
      toast.info("Checkout cancelled — nothing was charged.");
    }
    if (payment) {
      params.delete("payment");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStar = async (listing: Listing) => {
    if (!isAuthenticated) {
      toast("Sign in to star products.", {
        action: {
          label: "Sign in",
          onClick: () => navigate("/auth?returnTo=%2Fboard"),
        },
      });
      return;
    }
    try {
      await toggleStar({ listingId: listing._id as Id<"listings"> });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="board" />

      {/* Hero strip */}
      <section className="border-b border-border/60 bg-ledger">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <h1 className="type-display">
            Top leaders. Be the next
            <span className="text-accent-orange"> to claim #1</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Star what you love for free. Boost your own product with real
            dollars — or pay to drag a rival down. Ranks move live.
          </p>
          {stats && (
            <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<TrendingUp className="size-4" />} label="Boosted" value={stats.potCents} format="cents" />
              <StatCard icon={<Flame className="size-4" />} label="Sabotage paid" value={stats.sabotageCents} format="cents" />
              <StatCard icon={<HandCoins className="size-4" />} label="Paid moves" value={stats.bidCount} />
              <StatCard icon={<Star className="size-4" />} label="Stars given" value={stats.starCount} />
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Search + Range toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards…"
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 pl-9 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              aria-active={mode === "all"}
              className="relative"
              onClick={() => {
                const p = new URLSearchParams(params);
                p.delete("range");
                setParams(p);
              }}
            >
              {mode === "all" && (
                <motion.span
                  layoutId="board-range-pill"
                  transition={springSnappy}
                  className="segmented-pill"
                />
              )}
              <span className="relative z-10">All time</span>
            </button>
            <button
              type="button"
              aria-active={mode === "today"}
              className="relative"
              onClick={() => {
                const p = new URLSearchParams(params);
                p.set("range", "today");
                setParams(p);
              }}
            >
              {mode === "today" && (
                <motion.span
                  layoutId="board-range-pill"
                  transition={springSnappy}
                  className="segmented-pill"
                />
              )}
              <span className="relative z-10">Today</span>
            </button>
          </div>
        </div>

        {/* Category tabs — horizontal scroll strip */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-4">
          <TabButton active={!category} onClick={() => setParams({})}>
            🏆 All boards
          </TabButton>
          {CATEGORIES.map((c) => (
            <TabButton
              key={c.id}
              active={category === c.id}
              onClick={() => setParams({ category: c.id })}
            >
              {c.emoji} {c.label}
            </TabButton>
          ))}
        </div>

        {/* Globe Showcase — top 3 pinned to 3D globe */}
        {filteredBoard && filteredBoard.length >= 3 && mode === "all" && !search.trim() && (
          <GlobeShowcase
            listings={filteredBoard.slice(0, 3)}
            myIds={myIds}
            onPay={openPay}
            onDetail={(id) => setDetailId(id as Id<"listings">)}
          />
        )}
        {/* Fallback: single #1 spotlight if less than 3 listings */}
        {filteredBoard && filteredBoard.length > 0 && filteredBoard.length < 3 && mode === "all" && !search.trim() && (
          <SpotlightCard
            listing={filteredBoard[0]}
            isMine={myIds.has(filteredBoard[0]._id)}
            onPay={openPay}
            onDetail={() => setDetailId(filteredBoard[0]._id)}
          />
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Rankings */}
          <div className="overflow-hidden rounded-xl border border-border/70 card-premium">
            {!board ? (
              <BoardSkeleton />
            ) : (filteredBoard?.length ?? 0) === 0 ? (
              <div className="empty-state">
                {search.trim() ? `No results for "${search}".` : "Nobody's on this board yet. Submit a product and boost to #1."}
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {(filteredBoard ?? []).map((listing: Listing, i: number) => (
                  <motion.li
                    key={listing._id}
                    layout
                    transition={{
                      layout: { type: "spring", stiffness: 480, damping: 42 },
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.45,
                        delay: Math.min(i * 0.04, 0.4),
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                    whileHover={{
                      x: 4,
                      transition: { type: "spring", stiffness: 420, damping: 28 },
                    }}
                    className={cn(
                      "flex items-center gap-3 p-4 transition-colors hover:bg-accent/40",
                      listing.rank <= 3 && "bg-primary/[0.04]",
                      listing.rank === 1 && "rank-lead",
                      listing.featured &&
                      listing.featuredUntil &&
                      now > 0 &&
                      listing.featuredUntil > now &&
                      "border-l-2 border-l-amber-400 bg-amber-500/[0.04]",
                    )}
                  >
                    <RankBadge
                      rank={listing.rank}
                      locked={listing.isLocked}
                      delta={rankDeltas.get(listing._id) ?? 0}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <button
                          type="button"
                          onClick={() => setDetailId(listing._id)}
                          className="truncate text-left font-semibold hover:text-primary hover:underline"
                          title="View bid history"
                        >
                          {listing.title}
                        </button>
                        {listing.featured && listing.featuredUntil && now > 0 && listing.featuredUntil > now && (
                          <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px]">
                            ⭐ Featured
                          </Badge>
                        )}
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                          title={listing.url}
                        >
                          <ExternalLink className="size-3" />
                        </a>
                        {!category && getCategory(listing.category) && (
                          <Badge variant="secondary" className="text-[11px]">
                            <span className="inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/8 text-[8px] leading-none">{getCategory(listing.category)!.emoji}</span>
                            {getCategory(listing.category)!.label}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {listing.tagline || listing.url.replace(/^https?:\/\//, "")} · by{" "}
                        {listing.ownerName ?? "anon"}
                      </p>
                      {/* Bank-strength bar — share of the leader's bank */}
                      <div className="bank-bar mt-2 max-w-56" aria-hidden>
                        <span
                          style={{
                            width: `${Math.max(3, Math.min(100, (listing.totalPaid / leaderTotal) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                        <RowActions
                          listing={listing}
                          isMine={myIds.has(listing._id)}
                          starred={starredIds.has(listing._id)}
                          onStar={() => onStar(listing)}
                          onPay={(kind) => openPay(listing, kind)}
                        />
                      </div>
                    </div>

                    <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      <RowActions
                        listing={listing}
                        isMine={myIds.has(listing._id)}
                        starred={starredIds.has(listing._id)}
                        onStar={() => onStar(listing)}
                        onPay={(kind) => openPay(listing, kind)}
                      />
                    </div>

                    <div className="w-20 shrink-0 text-right">
                      <AnimatedCents
                        value={listing.totalPaid}
                        className="font-mono text-base font-bold tabular-nums text-primary"
                      />
                      <div className="font-label text-[10px] text-muted-foreground">
                        banked
                      </div>
                      {listing.starCount * STAR_CREDIT_CENTS +
                        (listing.referralCreditCents ?? 0) >
                        0 && (
                        <div className="text-[10px] font-medium text-accent-foreground">
                          +
                          {formatCents(
                            listing.starCount * STAR_CREDIT_CENTS +
                              (listing.referralCreditCents ?? 0),
                          )}{" "}
                          credit
                        </div>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Live feed + Trending boards */}
          <aside className="space-y-4">
            {/* Live feed */}
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-2 animate-ping rounded-full bg-primary opacity-60" />
                  <span className="inline-flex size-2 rounded-full bg-primary" />
                </span>
                Live money moves
              </h2>
              {activity.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="mt-2 space-y-0.5">
                  {activity.map((a) => (
                    <motion.li
                      key={a._id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/60"
                    >
                      {/* Status dot — beautifului.dev task row pattern */}
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-xs font-semibold", a.kind === "boost" ? "text-primary" : "text-destructive")}>
                            {a.kind === "boost" ? "+" : "−"}{formatCents(a.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">·</span>
                          <span className="truncate text-[11px] text-muted-foreground/80">
                            {a.userName}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                          {a.listingTitle}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Trending boards */}
            {leaders && leaders.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  🔥 Trending boards
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {leaders
                    .sort((a, b) => b.leaderCents - a.leaderCents)
                    .slice(0, 6)
                    .map((l) => {
                      const cat = getCategory(l.categoryId);
                      if (!cat) return null;
                      return (
                        <li key={l.categoryId}>
                          <button
                            type="button"
                            onClick={() => setParams({ category: l.categoryId })}
                            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left text-xs transition hover:border-primary/40 hover:bg-accent/40"
                          >
                            <span className="flex items-center gap-2">
                              <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/8 text-[10px] leading-none">{cat.emoji}</span>
                              <span className="font-medium truncate max-w-[140px]">{cat.label}</span>
                            </span>
                            <span className="font-mono font-semibold tabular-nums text-primary">
                              {formatCents(l.leaderCents)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>

      {payTarget?.kind === "boost" && (
        <PayDialog
          open
          onOpenChange={(o) => !o && setPayTarget(null)}
          kind="boost"
          listingId={payTarget.listing._id}
          listingTitle={payTarget.listing.title}
          minCents={payTarget.min}
          hint={payTarget.hint}
        />
      )}
      {payTarget?.kind === "dislike" && (
        <PayDialog
          open
          onOpenChange={(o) => !o && setPayTarget(null)}
          kind="dislike"
          listingId={payTarget.listing._id}
          listingTitle={payTarget.listing.title}
        />
      )}

      <ListingDetailDialog
        listingId={detailId}
        isMine={detailId ? myIds.has(detailId) : false}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function RowActions({
  listing,
  isMine,
  starred,
  onStar,
  onPay,
}: {
  listing: Listing;
  isMine: boolean;
  starred: boolean;
  onStar: () => void;
  onPay: (kind: "boost" | "dislike") => void;
}) {
  return (
    <>
      <Button
        size="sm"
        variant={starred ? "default" : "outline"}
        onClick={onStar}
        className="gap-1 px-2.5"
      >
        <motion.span
          key={starred ? "on" : "off"}
          initial={{ scale: 0.3, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springSnappy}
          className="inline-flex"
        >
          <Star className={cn("size-3.5", starred && "fill-current")} />
        </motion.span>
        {listing.starCount}
      </Button>
      {isMine ? (
        <Button size="sm" onClick={() => onPay("boost")} className="gap-1 px-2.5">
          <TrendingUp className="size-3.5" />
          Boost
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPay("dislike")}
          className="gap-1 border-destructive/40 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <ThumbsDown className="size-3.5" />
          Down-rank
        </Button>
      )}
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        title={`Visit ${listing.title}`}
      >
        <ExternalLink className="size-3.5" />
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(
            `${window.location.origin}/board?category=${listing.category}`,
          );
          toast.success("Board link copied!");
        }}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        title="Share this board"
      >
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      </button>
    </>
  );
}

function RankBadge({
  rank,
  locked,
  delta,
}: {
  rank: number;
  locked: boolean;
  delta: number;
}) {
  return (
    <div className="grid w-12 shrink-0 place-items-center">
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full text-xs font-black tabular-nums",
          rank === 1 && "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30",
          rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-md shadow-gray-400/20",
          rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20",
          rank > 3 && "text-muted-foreground",
        )}
      >
        {rank <= 3 ? rank : `#${rank}`}
      </span>
      {locked && (
        <span title="Locked at #1 (5x-lock)">
          <Crown className="size-3.5 text-accent-foreground" />
        </span>
      )}
      {delta !== 0 && (
        <motion.span
          key={`${rank}-${delta}`}
          initial={{ opacity: 0, y: delta > 0 ? 8 : -8, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springSnappy}
          className={cn(
            "text-[10px] leading-none font-bold tabular-nums",
            delta > 0 ? "text-green-600" : "text-destructive",
          )}
          title={delta > 0 ? `Climbed ${delta} spot${delta > 1 ? "s" : ""}` : `Fell ${-delta} spot${delta < -1 ? "s" : ""}`}
        >
          {delta > 0 ? "▲" : "▼"}
          {Math.abs(delta)}
        </motion.span>
      )}
    </div>
  );
}

function SpotlightCard({
  listing,
  isMine,
  onPay,
  onDetail,
}: {
  listing: Listing;
  isMine: boolean;
  onPay: (listing: Listing, kind: "boost" | "dislike") => void;
  onDetail: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-accent/40 p-4 shadow-lg shadow-primary/5 transition-shadow hover:shadow-xl hover:shadow-primary/10 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <p className="font-label flex items-center gap-2 text-[11px] font-medium text-primary">
          <span className="inline-block size-2 rounded-full bg-primary" />
          #1 spot{listing.isLocked ? " · locked 🔒" : ""}
        </p>
        <button
          type="button"
          onClick={onDetail}
          className="font-display mt-1 block max-w-full truncate text-left text-2xl font-bold tracking-tight hover:text-primary"
        >
          {listing.title}
        </button>
        <p className="truncate text-xs text-muted-foreground">
          {listing.tagline || listing.url.replace(/^https?:\/\//, "")} · by {" "}
          {listing.ownerName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <AnimatedCents
            value={listing.totalPaid}
            className="type-data text-2xl text-primary"
          />
          <div className="font-label text-[10px] text-muted-foreground">banked</div>
        </div>
        {isMine ? (
          <Button size="sm" onClick={() => onPay(listing, "boost")}>
            🛡 Defend #1
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onPay(listing, "dislike")}
          >
            ⚔ Knock it down
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
        active
          ? "border-primary"
          : "border-border/70 bg-card text-foreground/80 hover:bg-accent",
      )}
    >
      {active && (
        <motion.span
          layoutId="board-tab-pill"
          transition={springSnappy}
          className="absolute inset-0 rounded-full bg-primary"
        />
      )}
      <span className={cn("relative z-10", active && "text-primary-foreground")}>
        {children}
      </span>
    </button>
  );
}
