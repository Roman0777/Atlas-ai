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
  Star,
  ThumbsDown,
  TrendingUp,
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

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs text-muted-foreground">
              Founder workspace
            </p>
            <h1 className="type-display mt-1">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>
          <Button onClick={() => setSubmitOpen(true)} className="gap-2 self-start">
            <Plus className="size-4" />
            Submit a product
          </Button>
        </header>

        {/* Referral program */}
        <ReferralCard />

        {/* Premium Analytics */}
        <PremiumAnalytics mine={mine} />

        {/* My listings */}
        <section className="mt-8">
          <h2 className="font-label text-xs text-muted-foreground">
            Your listings
          </h2>
          {!mine ? (
            <div className="mt-3 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <Card className="mt-3 border-dashed shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="text-4xl">🚀</span>
                <p className="max-w-sm text-sm text-muted-foreground">
                  You haven't listed anything yet. Add your SaaS, repo
                  or token — then outbid everyone for #1.
                </p>
                <Button variant="outline" onClick={() => setSubmitOpen(true)}>
                  List your first product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.ul
              variants={stagger(0.08)}
              initial="hidden"
              animate="show"
              className="mt-3 space-y-3"
            >
              {mine.map((l) => (
                <motion.li
                  key={l._id}
                  variants={fadeUp}
                  whileHover={{ y: -2, transition: springSnappy }}
                >
                  <Card className="shadow-none">
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-semibold hover:text-primary hover:underline"
                          >
                            {l.title}
                            <ExternalLink className="size-3.5 opacity-60" />
                          </a>
                          {getCategory(l.category) && (
                            <Badge variant="secondary" className="text-[11px]">
                              {getCategory(l.category)!.emoji}{" "}
                              {getCategory(l.category)!.label}
                            </Badge>
                          )}
                          {l.isLocked && (
                            <Badge className="gap-1 text-[11px]">
                              <Crown className="size-3" /> Locked #1
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {l.rank != null ? (
                              <>
                                Rank <b className="text-foreground">#{l.rank}</b>
                              </>
                            ) : (
                              "Unranked (no money banked)"
                            )}
                          </span>
                          <span>⭐ {l.starCount} stars</span>
                          <span>👎 {l.dislikeCount} hits taken</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <AnimatedCents
                            value={l.totalPaid}
                            className="type-data text-lg text-primary"
                          />
                          <div className="font-label text-[10px] text-muted-foreground">
                            banked
                          </div>
                        </div>
                        {l.isLeading ? (
                          <Button size="sm" variant="outline" className="gap-1" disabled>
                            👑 Leading
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1"
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
        <section className="mt-10">
          <h2 className="font-label text-xs text-muted-foreground">
            Your payments
          </h2>
          {!myBids || myBids.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No payments yet. Boosts and down-ranks show up here.
            </p>
          ) : (
            <ul className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-card">
              {myBids.map((b) => (
                <li
                  key={b._id}
                  className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {b.kind === "boost" ? (
                      <TrendingUp className="size-4 shrink-0 text-primary" />
                    ) : (
                      <ThumbsDown className="size-4 shrink-0 text-destructive" />
                    )}
                    <span className={cn(b.kind === "boost" ? "text-primary" : "text-destructive")}>
                      {b.kind === "boost" ? "Boost" : "Down-rank"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      “{b.listingTitle}”
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-mono font-bold tabular-nums">
                      {formatCents(b.amount)}
                    </span>{" "}
                    <Badge
                      variant={b.status === "paid" ? "secondary" : "outline"}
                      className="ml-1 text-[10px]"
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
    <section className="mt-8 rounded-xl border border-primary/30 bg-accent/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-label flex items-center gap-2 text-xs font-medium text-primary">
            <Gift className="size-3.5" /> Invite builders, climb free
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Each signup via your link adds <b>$2 rank credit</b> to your top
            listing. Every star your products earn adds <b>$0.10</b>.{" "}
            <Star className="inline size-3 text-primary" />
          </p>
        </div>
        <div className="flex w-full max-w-md shrink-0 items-center gap-2">
          <input
            readOnly
            value={link || "…"}
            onFocus={(e) => e.currentTarget.select()}
            className="h-9 w-full min-w-0 rounded-md border border-border/70 bg-card px-3 font-mono text-xs text-muted-foreground"
          />
          <Button size="sm" variant="outline" onClick={copy} className="shrink-0 gap-1">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      {(referral?.referralCount ?? 0) > 0 && (
        <p className="font-label mt-3 text-[11px] text-muted-foreground">
          {referral!.referralCount} referral{referral!.referralCount === 1 ? "" : "s"} ·{" "}
          {formatCents(referral!.referralCount * 200)} credit earned
        </p>
      )}
    </section>
  );
}

/**
 * Premium analytics for listing owners.
 */
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
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <h2 className="font-label text-xs text-muted-foreground">
          Portfolio analytics
        </h2>
        <Badge variant="outline" className="text-[10px]">
          ✨ Premium
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total banked</p>
            <p className="mt-1 type-data text-lg">
              <AnimatedCents value={totalBanked} />
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Boosts received</p>
            <p className="mt-1 font-mono text-lg font-bold text-green-600">
              +<AnimatedCents value={totalBoosts} />
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sabotaged</p>
            <p className="mt-1 font-mono text-lg font-bold text-destructive">
              -<AnimatedCents value={totalSabotaged} />
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg rank</p>
            <p className="mt-1 type-data text-lg">
              #{Math.round(avgRank)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total stars</p>
            <p className="mt-1 type-data text-lg">⭐ {totalStars}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Listings</p>
            <p className="mt-1 type-data text-lg">{mine.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Top listing</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {topListing?.title ?? "—"}
            </p>
            <p className="font-mono text-xs text-primary">
              {topListing ? formatCents(topListing.totalPaid ?? 0) : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalSabotaged > 0 && (
        <p className="font-label mt-3 text-[11px] text-muted-foreground">
          ⚠️ You've been sabotaged for {formatCents(totalSabotaged)}. Consider
          boosting back or enabling 5x-lock.
        </p>
      )}
    </section>
  );
}
