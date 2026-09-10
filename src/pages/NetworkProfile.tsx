import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Coins,
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { getCategory } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";

export default function NetworkProfile({
  kind,
}: {
  kind: "startup" | "investor";
}) {
  const params = useParams();
  const id = params.id as Id<"startupProfiles"> | Id<"investorProfiles"> | undefined;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const startups = useQuery(api.dealRoom.listStartups, {});
  const investors = useQuery(api.dealRoom.listInvestors, {});
  const myProfiles = useQuery(api.dealRoom.getMyProfiles, {});
  const sendIntro = useMutation(api.dealRoom.sendIntro);

  const startup =
    kind === "startup"
      ? startups?.find((s) => s._id === id)
      : undefined;
  const investor =
    kind === "investor"
      ? investors?.find((i) => i._id === id)
      : undefined;

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const canIntro =
    isAuthenticated &&
    (kind === "investor"
      ? !!myProfiles?.startup
      : !!myProfiles?.investor);

  async function onSend() {
    if (!startup && !investor) return;
    if (kind === "investor" && investor && myProfiles?.startup) {
      setSending(true);
      try {
        const { creditsCharged } = await sendIntro({
          startupId: myProfiles.startup._id,
          investorId: investor._id,
          message,
        });
        toast.success(
          creditsCharged > 0
            ? `Intro sent — ${creditsCharged} credits charged.`
            : "Intro sent.",
        );
        setMessage("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't send intro.");
      } finally {
        setSending(false);
      }
    } else if (kind === "startup" && startup && myProfiles?.investor) {
      setSending(true);
      try {
        await sendIntro({
          startupId: startup._id,
          investorId: myProfiles.investor._id,
          message,
        });
        toast.success("Intro sent.");
        setMessage("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't send intro.");
      } finally {
        setSending(false);
      }
    }
  }

  const isLoading = authLoading || (kind === "startup" ? startups === undefined : investors === undefined);

  const notFound =
    !isLoading &&
    ((kind === "startup" && !startup) || (kind === "investor" && !investor));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="network" />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link
          to="/network"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to Deal Room
        </Link>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : notFound ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Profile not found.
          </div>
        ) : kind === "startup" && startup ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                      {startup.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {startup.tagline}
                    </p>
                  </div>
                  <Badge variant="outline">{startup.stage}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <CategoryIcon icon={getCategory(startup.sector)?.icon} className="size-3" />
                    {getCategory(startup.sector)?.label}
                  </Badge>
                  {startup.askAmount ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Ask ${startup.askAmount.toLocaleString()}
                    </Badge>
                  ) : null}
                  {startup.teamSize ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {startup.teamSize} people
                    </Badge>
                  ) : null}
                  {startup.foundedYear ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Founded {startup.foundedYear}
                    </Badge>
                  ) : null}
                </div>
                {startup.elevatorPitch && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {startup.elevatorPitch}
                  </p>
                )}
                {startup.traction && (
                  <div>
                    <div className="text-xs text-muted-foreground">Traction</div>
                    <p className="text-sm">{startup.traction}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {startup.website && (
                    <Button asChild variant="outline" size="sm">
                      <a href={startup.website} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> Website
                      </a>
                    </Button>
                  )}
                  {startup.deckUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={startup.deckUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> Deck
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {canIntro && (
              <Card>
                <CardContent className="space-y-2 pt-6">
                  <div className="text-sm font-medium">Introduce this startup</div>
                  <p className="text-xs text-muted-foreground">
                    Show the founder your interest (free for investors).
                  </p>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Why this founder should open a convo with you…"
                    maxLength={500}
                  />
                  <Button
                    className="w-full"
                    onClick={onSend}
                    disabled={sending || message.trim().length < 10}
                  >
                    {sending ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 size-4" />
                    )}
                    Send intro
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : investor ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                      {investor.orgName}
                    </h1>
                    {investor.verified && (
                      <BadgeCheck className="size-5 shrink-0 text-sky-400" />
                    )}
                  </div>
                  <Badge>{investor.type}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {investor.thesis}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {investor.sectors.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 text-[10px]">
                      <CategoryIcon icon={getCategory(s)?.icon} className="size-3" />
                      {getCategory(s)?.label}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {investor.stages.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
                {(investor.checkMin || investor.checkMax) && (
                  <p className="text-sm">
                    Check size:{" "}
                    <span className="font-medium">
                      {investor.checkMin
                        ? `$${investor.checkMin.toLocaleString()}`
                        : "$0"}
                      {" – "}
                      {investor.checkMax
                        ? `$${investor.checkMax.toLocaleString()}`
                        : "∞"}
                    </span>
                  </p>
                )}
                {investor.portfolioCount ? (
                  <p className="text-sm">
                    Portfolio companies:{" "}
                    <span className="font-medium">
                      {investor.portfolioCount}
                    </span>
                  </p>
                ) : null}
                {investor.website && (
                  <Button asChild variant="outline" size="sm">
                    <a href={investor.website} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 size-3.5" /> Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Coins className="size-4 text-amber-500" />
                  Request an intro
                </div>
                {canIntro ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Founders can pitch this investor directly from your startup
                      profile. Costs 25 credits.
                    </p>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="One paragraph: what you build, traction, why they're a fit…"
                      maxLength={500}
                    />
                    <Button
                      className="w-full"
                      onClick={onSend}
                      disabled={sending || message.trim().length < 10}
                    >
                      {sending ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 size-4" />
                      )}
                      Send intro (25 credits)
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Create your{" "}
                    <Link className="underline" to="/network">
                      startup profile
                    </Link>{" "}
                    to send intros (25 credits).
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}