import { AnimatedCents } from "@/components/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, formatCents, getCategory } from "@/lib/categories";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

const PRESETS = [500, 1000, 2500, 5000];

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Listing detail: stats, live rank, retake price, and full bid history. */
export function ListingDetailDialog({
  listingId,
  isMine,
  onClose,
}: {
  listingId: string | null;
  isMine: boolean;
  onClose: () => void;
}) {
  const detail = useQuery(
    api.listings.getListingDetail,
    listingId ? { listingId: listingId as Id<"listings"> } : "skip",
  );
  const [payKind, setPayKind] = useState<"boost" | "dislike" | null>(null);

  const retakeCents =
    detail && !detail.isLeading && detail.neededToLead > 0
      ? Math.max(200, detail.neededToLead)
      : null;

  return (
    <>
      <Dialog open={!!listingId} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {!detail ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading listing…
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="font-label flex items-center gap-2 text-[11px] text-muted-foreground">
                  {getCategory(detail.category) && (
                    <>
                      {getCategory(detail.category)!.emoji} {getCategory(detail.category)!.label}
                    </>
                  )}
                  {detail.rank != null && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      #{detail.rank}
                    </Badge>
                  )}
                  {detail.isLocked && (
                    <Badge className="text-[10px]">🔒 locked #1</Badge>
                  )}
                </div>
                <DialogTitle className="font-display text-left text-2xl font-black tracking-tight">
                  {detail.title}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {detail.tagline || detail.url.replace(/^https?:\/\//, "")} · by {detail.ownerName}
                </DialogDescription>
              </DialogHeader>

              <a
                href={detail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-primary hover:underline"
              >
                {detail.url} ↗
              </a>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="font-mono text-base font-bold tabular-nums text-primary">
                    <AnimatedCents value={detail.totalPaid} />
                  </div>
                  <div className="font-label text-[9px] text-muted-foreground">banked</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="font-mono text-base font-bold tabular-nums">⭐ {detail.starCount}</div>
                  <div className="font-label text-[9px] text-muted-foreground">stars</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="font-mono text-base font-bold tabular-nums">👎 {detail.dislikeCount}</div>
                  <div className="font-label text-[9px] text-muted-foreground">hits taken</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="font-mono text-base font-bold tabular-nums text-destructive">
                    {formatCents(detail.sabotagedCents)}
                  </div>
                  <div className="font-label text-[9px] text-muted-foreground">sabotaged</div>
                </div>
              </div>

              {retakeCents != null && (
                <p className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-foreground">
                  Outbid? Retake the lead for just {formatCents(retakeCents)} — you only pay the
                  difference + $1.
                </p>
              )}

              <div>
                <h4 className="font-label mb-2 text-[11px] text-muted-foreground">
                  Bid history
                </h4>
                {detail.bids.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No payments yet.</p>
                ) : (
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {detail.bids.map((b) => (
                      <li
                        key={b._id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={
                              b.kind === "boost" ? "text-primary" : "text-destructive"
                            }
                          >
                            {b.kind === "boost" ? "🚀" : "👎"}
                          </span>
                          <span className="truncate text-muted-foreground">
                            {b.userName} · {timeAgo(b.createdAt)}
                          </span>
                        </span>
                        <span className="font-mono font-bold tabular-nums">
                          {b.kind === "boost" ? "+" : "−"}
                          {formatCents(b.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter>
                {isMine ? (
                  <Button onClick={() => setPayKind("boost")}>
                    🚀 Boost{retakeCents != null ? ` for ${formatCents(retakeCents)}` : ""}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setPayKind("dislike")}
                  >
                    👎 Pay to down-rank
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {detail && payKind && (
        <PayDialog
          open
          onOpenChange={(o) => !o && setPayKind(null)}
          kind={payKind}
          listingId={detail._id}
          listingTitle={detail.title}
          minCents={payKind === "boost" && retakeCents != null ? retakeCents : undefined}
          hint={
            payKind === "boost" && retakeCents != null
              ? `Retake pricing: only ${formatCents(retakeCents)} puts you back on top.`
              : undefined
          }
        />
      )}
    </>
  );
}

/** Boost (own listing) or paid-sabotage (someone else's) checkout dialog. */
export function PayDialog({
  open,
  onOpenChange,
  kind,
  listingId,
  listingTitle,
  minCents,
  hint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "boost" | "dislike";
  listingId: string;
  listingTitle: string;
  minCents?: number;
  hint?: string;
}) {
  const createCheckout = useCheckout();
  const [preset, setPreset] = useState<number>(minCents ?? 500);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const customCents = custom ? Math.round(parseFloat(custom) * 100) : NaN;
  const amountCents =
    Number.isInteger(customCents) && customCents > 0 ? customCents : preset;
  const belowMin = minCents != null && amountCents < minCents;
  const invalid = !Number.isInteger(amountCents) || amountCents < 200;

  const pay = async () => {
    setBusy(true);
    try {
      const url = await createCheckout({
        origin: window.location.origin,
        listingId: listingId as Id<"listings">,
        amountCents,
        kind,
      });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "boost" ? (
              <>🚀 Boost “{listingTitle}”</>
            ) : (
              <>👎 Pay to down-rank “{listingTitle}”</>
            )}
          </DialogTitle>
          <DialogDescription>
            {kind === "boost"
              ? "Every dollar adds to this listing's total. Whole US dollars only, $5 minimum."
              : "Every dollar drags this listing down the board. Costs 2× their bank. $5 minimum."}
          </DialogDescription>
        </DialogHeader>

        {hint && (
          <p className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-foreground">
            {hint}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((c) => (
            <Button
              key={c}
              type="button"
              variant={amountCents === c && !custom ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPreset(c);
                setCustom("");
              }}
            >
              ${c / 100}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            min={5}
            step={1}
            placeholder={`Custom ($${Math.max(5, Math.ceil((minCents ?? 500) / 100))}+)`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">
            = {formatCents(amountCents || 0)}
          </span>
        </div>

        {belowMin && (
          <p className="text-xs font-medium text-destructive">
            Below what's needed right now — raise the amount.
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={pay}
            disabled={busy || invalid || belowMin}
            className={
              kind === "dislike" ? "bg-destructive text-white hover:bg-destructive/90" : ""
            }
          >
            {busy
              ? "Opening Dodo Checkout…"
              : `${kind === "boost" ? "Boost" : "Down-rank"} for ${formatCents(amountCents || 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useCheckout() {
  return useAction(api.payments.createCheckout);
}

/** Submit a new product to a leaderboard. */
export function SubmitListingDialog({
  open,
  onOpenChange,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  onCreated?: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const createCheckout = useAction(api.payments.createCheckout);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? CATEGORIES[0].id);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isAuthenticated) {
      toast.error("Sign in to submit a product.");
      return;
    }
    setBusy(true);
    try {
      const checkoutUrl = await createCheckout({
        origin: window.location.origin,
        amountCents: 500,
        kind: "listing",
        title,
        url,
        tagline: tagline || undefined,
        category,
      });
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a product</DialogTitle>
          <DialogDescription>
            $5 one-time listing fee. After that, rank is decided by real
            money, stars (+$0.10 each) and referrals (+$2 each).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="listing-title">Name</Label>
            <Input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Acme Copilot"
              maxLength={80}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="listing-url">URL or profile handle</Label>
            <Input
              id="listing-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://acme.dev, @xhandle, or instagram.com/user"
            />
            <p className="text-[10px] text-muted-foreground">
              Supports: websites, X, YouTube, Instagram, TikTok, LinkedIn, Twitch, Substack
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="listing-tagline">Tagline</Label>
            <Textarea
              id="listing-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One sharp sentence."
              maxLength={140}
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Board</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || title.trim().length < 2 || !url.trim()}>
            {busy ? "Opening checkout…" : "List it — $5"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

