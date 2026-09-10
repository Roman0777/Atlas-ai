import { AnimatedCents } from "@/components/animated-number";
import {
  PayDialog,
  SubmitListingDialog,
} from "@/components/listing-dialogs";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatCents, getCategory } from "@/lib/categories";
import { fadeUp, springSnappy, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  Gift,
  Plus,
  Rocket,
  Sparkles,
  Star,
  ThumbsDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const mine = useQuery(api.listings.getMine);
  const myBids = useQuery(api.listings.getMyBids);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [boostTarget, setBoostTarget] = useState<{
    id: string;
    title: string;
    min: number;
    hint?: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="dashboard" />

      <main className="mx-auto w-full max-w-5xl px-5 pt-20 pb-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs text-muted-foreground/75">
              Founder workspace
            </p>
            <h1 className="type-display mt-1">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>
          <Button onClick={() => setSubmitOpen(true)} className="gap-2 self-start rounded-full">
            <Plus className="size-4" />
            Submit a product
          </Button>
        </header>

        {/* Referral program */}
        <ReferralCard />

        {/* Premium Analytics */}
        <PremiumAnalytics mine={mine} />

        {/* My listings */}
        <section className="mt-10">
          <h2 className="font-label text-xs text-muted-foreground/75">
            Your listings
          </h2>
          {!mine ? (
            <div className="mt-4 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/30" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <Card className="mt-4 border-dashed rounded-2xl">
              <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-primary/8 text-primary">
                  <Rocket className="size-7" />
                </span>
                <p className="max-w-sm text-sm text-muted-foreground/60">
                  You haven't listed anything yet. Add your SaaS, repo
                  or token — then outbid everyone for #1.
                </p>
                <Button variant="outline" onClick={() => setSubmitOpen(true)} className="rounded-full">
                  List your first product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.ul
              variants={stagger(0.08)}
              initial="hidden"
              animate="show"
              className="mt-4 space-y-3"
            >
              {mine.map((l) => (
                <motion.li
                  key={l._id}
                  variants={fadeUp}
                  whileHover={{ y: -2, transition: springSnappy }}
                >
                  <Card className="rounded-2xl shadow-none border-border/30">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 font-semibold hover:text-primary hover:underline"
                          >
                            {l.title}
                            <ExternalLink className="size-3.5 opacity-50" />
                          </a>
                          {getCategory(l.category) && (
                            <Badge variant="secondary" className="text-[11px] rounded-full">
                              {getCategory(l.category)!.emoji}{" "}
                              {getCategory(l.category)!.label}
                            </Badge>
                          )}
                          {l.isLocked && (
                            <Badge className="gap-1 text-[11px] rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                              <Crown className="size-3" /> Locked #1
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground/75">
                          <span>
                            {l.rank != null ? (
                              <>
                                Rank <b className="text-foreground">#{l.rank}</b>
                              </>
                            ) : (
                              "Unranked (no money banked)"
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3" /> {l.starCount} stars
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ThumbsDown className="size-3" /> {l.dislikeCount} hits taken
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <AnimatedCents
                            value={l.totalPaid}
                            className="type-data text-lg text-primary"
                          />
                          <div className="font-label text-[10px] text-muted-foreground/70">
                            banked
                          </div>
                        </div>
                        {l.isLeading ? (
                          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" disabled>
                            <Crown className="size-3.5" /> Leading
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1 rounded-full"
                            onClick={() =>
                              setBoostTarget({
                                id: l._id,
                                title: l.title,
                                min: l.minBoostCents,
                                hint:
                                  l.neededToLead > 0
                                    ? `You need ${formatCents(l.neededToLead)} to take #1 right now.`
                                    : undefined,
                              })
                            }
                          >
                            <Rocket className="size-3.5" />
                            Boost to lead
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        {/* Payment history */}
        <section className="mt-12">
          <h2 className="font-label text-xs text-muted-foreground/75">
            Your payments
          </h2>
          {!myBids || myBids.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground/70">
              No payments yet. Boosts and down-ranks show up here.
            </p>
          ) : (
            <ul className="mt-4 overflow-hidden rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm">
              {myBids.map((b) => (
                <li
                  key={b._id}
                  className="flex items-center justify-between gap-3 border-b border-border/20 px-5 py-4 text-sm last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {b.kind === "boost" ? (
                      <TrendingUp className="size-4 shrink-0 text-primary" />
                    ) : (
                      <ThumbsDown className="size-4 shrink-0 text-destructive" />
                    )}
                    <span className={cn(b.kind === "boost" ? "text-primary" : "text-destructive")}>
                      {b.kind === "boost" ? "Boost" : "Down-rank"}
                    </span>
                    <span className="truncate text-muted-foreground/75">
                      "{b.listingTitle}"
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-mono font-bold tabular-nums">
                      {formatCents(b.amount)}
                    </span>{" "}
                    <Badge
                      variant={b.status === "paid" ? "secondary" : "outline"}
                      className="ml-1 text-[10px] rounded-full"
                    >
                      {b.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SubmitListingDialog open={submitOpen} onOpenChange={setSubmitOpen} />
      {boostTarget && (
        <PayDialog
          open
          onOpenChange={(o) => !o && setBoostTarget(null)}
          kind="boost"
          listingId={boostTarget.id}
          listingTitle={boostTarget.title}
          minCents={boostTarget.min}
          hint={boostTarget.hint}
        />
      )}
    </div>
  );
}

function ReferralCard() {
  const referral = useQuery(api.referrals.getMyReferral);
  const ensureCode = useMutation(api.referrals.ensureReferralCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void ensureCode().catch(() => {});
  }, [ensureCode]);

  const link = referral?.code
    ? `${window.location.origin}/?ref=${referral.code}`
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link manually.");
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-primary/20 bg-accent/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-label flex items-center gap-2 text-xs font-medium text-primary/80">
            <Gift className="size-3.5" /> Invite builders, climb free
          </h2>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Each signup via your link adds <b>$2 rank credit</b> to your top
            listing. Every star your products earn adds <b>$0.10</b>.{" "}
            <Star className="inline size-3 text-primary/60" />
          </p>
        </div>
        <div className="flex w-full max-w-md shrink-0 items-center gap-2">
          <input
            readOnly
            value={link || "…"}
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 w-full min-w-0 rounded-xl border border-border/30 bg-card/60 px-4 font-mono text-xs text-muted-foreground/60 backdrop-blur-sm"
          />
          <Button size="sm" variant="outline" onClick={copy} className="shrink-0 gap-1.5 rounded-full">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      {(referral?.referralCount ?? 0) > 0 && (
        <p className="font-label mt-4 text-[11px] text-muted-foreground/70">
          {referral!.referralCount} referral{referral!.referralCount === 1 ? "" : "s"} ·{" "}
          {formatCents(referral!.referralCount * 200)} credit earned
        </p>
      )}
    </section>
  );
}

type MineListing = {
  title?: string;
  totalPaid?: number;
  boostedCents?: number;
  sabotagedCents?: number;
  starCount?: number;
  rank?: number | null;
};

function PremiumAnalytics({
  mine,
}: {
  mine: MineListing[] | undefined;
}) {
  if (!mine || mine.length === 0) return null;

  const totalBanked = mine.reduce((s, l) => s + (l.totalPaid ?? 0), 0);
  const totalBoosts = mine.reduce((s, l) => s + (l.boostedCents ?? 0), 0);
  const totalSabotaged = mine.reduce((s, l) => s + (l.sabotagedCents ?? 0), 0);
  const totalStars = mine.reduce((s, l) => s + (l.starCount ?? 0), 0);
  const avgRank =
    mine
      .filter((l) => l.rank != null)
      .reduce((s, l) => s + (l.rank ?? 0), 0) /
    (mine.filter((l) => l.rank != null).length || 1);
  const topListing = mine.reduce((best, l) =>
    (l.totalPaid ?? 0) > (best?.totalPaid ?? 0) ? l : best,
  );

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <h2 className="font-label text-xs text-muted-foreground/75">
          Portfolio analytics
        </h2>
        <Badge variant="outline" className="gap-1 rounded-full border-border/30 text-[10px]">
          <Sparkles className="size-3" /> Premium
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Total banked</p>
            <p className="mt-1.5 type-data text-lg">
              <AnimatedCents value={totalBanked} />
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Boosts received</p>
            <p className="mt-1.5 font-mono text-lg font-bold text-green-600 dark:text-green-400">
              +<AnimatedCents value={totalBoosts} />
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Sabotaged</p>
            <p className="mt-1.5 font-mono text-lg font-bold text-destructive">
              -<AnimatedCents value={totalSabotaged} />
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Avg rank</p>
            <p className="mt-1.5 type-data text-lg">
              #{Math.round(avgRank)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Total stars</p>
            <p className="mt-1.5 flex items-center gap-1.5 type-data text-lg">
              <Star className="size-4" /> {totalStars}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Listings</p>
            <p className="mt-1.5 type-data text-lg">{mine.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none border-border/30 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground/70">Top listing</p>
            <p className="mt-1.5 truncate text-sm font-semibold">
              {topListing?.title ?? "—"}
            </p>
            <p className="font-mono text-xs text-primary/70">
              {topListing ? formatCents(topListing.totalPaid ?? 0) : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalSabotaged > 0 && (
        <p className="font-label mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
          <TriangleAlert className="mt-0.5 size-3 shrink-0" />
          <span>
            You've been sabotaged for {formatCents(totalSabotaged)}. Consider
            boosting back or enabling 5x-lock.
          </span>
        </p>
      )}
    </section>
  );
}
