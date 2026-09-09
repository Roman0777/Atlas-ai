import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PassportStamps } from "@/components/passport-stamps";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Flame,
  Gift,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const KIND_META: Record<string, { label: string; earn: boolean }> = {
  signup_bonus: { label: "Welcome bonus", earn: true },
  daily_renewal: { label: "Daily renewal", earn: true },
  referral: { label: "Referral reward", earn: true },
  transfer_in: { label: "Transfer received", earn: true },
  transfer_out: { label: "Transfer sent", earn: false },
  bid_boost: { label: "Board boost", earn: false },
  bid_dislike: { label: "Board sabotage", earn: false },
  salary_boost: { label: "Salary bid boost", earn: false },
  listing_fee: { label: "Listing fee", earn: false },
  ai_usage: { label: "AI usage", earn: false },
  ai_refund: { label: "AI refund", earn: true },
  purchase: { label: "Credit pack", earn: true },
  admin_grant: { label: "Admin grant", earn: true },
};

function timeAgo(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Credits() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const wallet = useQuery(api.credits.getWallet);
  const ledger = useQuery(api.credits.getLedger);
  const claim = useMutation(api.credits.claimDailyRenewal);
  const transfer = useMutation(api.credits.transferCredits);

  const [toCode, setToCode] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function onClaim() {
    try {
      const res = await claim();
      if (res.claimed) {
        toast.success(`+${res.amount} credits — ${res.streak}-day streak! 🔥`);
      } else {
        toast.info("Already claimed today. Come back tomorrow!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed.");
    }
  }

  async function onTransfer(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseInt(amount, 10);
    if (!Number.isInteger(n)) {
      toast.error("Enter a whole number of credits.");
      return;
    }
    setSending(true);
    try {
      const res = await transfer({ toCode, amount: n, note: note || undefined });
      toast.success(`Sent ${n.toLocaleString()} credits to ${res.toName}.`);
      setToCode("");
      setAmount("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="credits" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {authLoading || wallet === undefined ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated || wallet === null ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Sign in to open your wallet.
          </div>
        ) : (
          <div className="space-y-6">
            <header>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Credit wallet
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                1 credit = $0.01 of rank power. Earn, renew, bid, transfer —
                and soon: spend on AI.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent md:col-span-2">
                <CardContent className="flex items-center gap-4 pt-6">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-500/15">
                    <Coins className="size-7 text-amber-400" />
                  </span>
                  <div>
                    <div className="font-display text-4xl font-bold tabular-nums">
                      {wallet.balance.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ ${(wallet.balance / 100).toFixed(2)} in rank power
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    <Flame className="mr-1 size-3 text-orange-400" />
                    {wallet.streak}-day streak
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium">Daily renewal</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {wallet.canClaim
                      ? `Claim +${wallet.nextClaimAmount} credits today. Streaks add +10/day.`
                      : "Claimed today — come back tomorrow."}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    disabled={!wallet.canClaim}
                    onClick={onClaim}
                  >
                    <Gift className="mr-1.5 size-4" />
                    {wallet.canClaim ? `Claim +${wallet.nextClaimAmount}` : "Claimed"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
              <CardContent className="pt-6">
                <PassportStamps streak={wallet.streak} />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-5">
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Send className="size-4 text-primary" />
                    Transfer credits
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Send to another member's referral code (shown in their
                    Dashboard). Max 500/day.
                  </p>
                  <form onSubmit={onTransfer} className="mt-3 space-y-2">
                    <Input
                      value={toCode}
                      onChange={(e) => setToCode(e.target.value)}
                      placeholder="Recipient code (e.g. k7m2x9pq)"
                      required
                    />
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      min={1}
                      max={500}
                      step={1}
                      placeholder="Amount (credits)"
                      required
                    />
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note (optional)"
                      maxLength={140}
                    />
                    <Button type="submit" className="w-full" disabled={sending}>
                      {sending ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 size-4" />
                      )}
                      Send
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-primary" />
                    How to earn
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li className="flex justify-between gap-2">
                      <span>Welcome bonus (one-time)</span>
                      <span className="font-medium text-emerald-400">+100</span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Daily renewal (streaks add +10/day)</span>
                      <span className="font-medium text-emerald-400">+100…200</span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Referral — Bronze / Silver / Gold tier</span>
                      <span className="font-medium text-emerald-400">+300 / +500 / +1000</span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Future credit packs</span>
                      <span className="font-medium text-emerald-400">varies</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium">Recent activity</div>
                {ledger === undefined ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : ledger.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No credit activity yet — claim your daily renewal above.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-border/60">
                    {ledger.map((row) => {
                      const meta = KIND_META[row.kind] ?? {
                        label: row.kind,
                        earn: row.amount > 0,
                      };
                      return (
                        <li
                          key={row._id}
                          className="flex items-center gap-3 py-2.5 text-sm"
                        >
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full ${
                              meta.earn
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {meta.earn ? (
                              <ArrowDownLeft className="size-4" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{meta.label}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {row.description ?? timeAgo(row.createdAt)}
                              {row.description ? ` · ${timeAgo(row.createdAt)}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-semibold tabular-nums ${
                                row.amount > 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {row.amount > 0 ? "+" : ""}
                              {row.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] tabular-nums text-muted-foreground">
                              bal {row.balanceAfter.toLocaleString()}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
