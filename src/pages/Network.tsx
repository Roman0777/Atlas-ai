import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Loader2,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { CATEGORIES, getCategory } from "@/lib/categories";

const STAGES = ["pre-seed", "seed", "series-a", "series-b", "growth"];
const TYPES = [
  { id: "vc", label: "VC Fund" },
  { id: "angel", label: "Angel" },
  { id: "incubator", label: "Incubator" },
  { id: "accelerator", label: "Accelerator" },
] as const;

const TYPE_BADGE = {
  vc: "bg-blue-500/10 text-blue-400",
  angel: "bg-purple-500/10 text-purple-400",
  incubator: "bg-teal-500/10 text-teal-400",
  accelerator: "bg-orange-500/10 text-orange-400",
} as const;

export default function Network() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const myProfiles = useQuery(api.dealRoom.getMyProfiles, {});
  const tab = useQuery(api.dealRoom.listStartups, {});
  const tabInvs = useQuery(api.dealRoom.listInvestors, {});
  const upsertStartup = useMutation(api.dealRoom.upsertStartupProfile);
  const upsertInvestor = useMutation(api.dealRoom.upsertInvestorProfile);
  const intros = useQuery(api.dealRoom.myIntros, {});
  const respond = useMutation(api.dealRoom.respondToIntro);

  const [view, setView] = useState<"discover" | "join">("discover");
  const [kind, setKind] = useState<"startups" | "investors">("startups");
  const [stage, setStage] = useState("");
  const [sector, setSector] = useState("");

  // Join forms
  const [sName, setSN] = useState("");
  const [sTag, setST] = useState("");
  const [sSector, setSS] = useState("ai-tools");
  const [sStage, setSSg] = useState("pre-seed");
  const [sAsk, setSA] = useState("");
  const [sPitch, setSP] = useState("");

  const [iOrg, setIO] = useState("");
  const [iType, setIT] = useState<"vc" | "angel" | "incubator" | "accelerator">("vc");
  const [iThesis, setITh] = useState("");
  const [iStages, setIS] = useState<string[]>([]);
  const [iSectors, setISec] = useState<string[]>([]);
  const [iCheckMin, setICMin] = useState("");
  const [iCheckMax, setICMax] = useState("");

  const startupList = stage || sector
    ? tab?.filter(
        (s) =>
          (!stage || s.stage === stage) && (!sector || s.sector === sector),
      ) ?? []
    : tab ?? [];
  const investorList = kind === "investors" ? (tabInvs ?? []) : [];

  async function joinStartup(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertStartup({
        name: sName,
        tagline: sTag,
        sector: sSector,
        stage: sStage,
        askAmount: sAsk ? Number.parseInt(sAsk, 10) : undefined,
        elevatorPitch: sPitch || undefined,
      });
      toast.success(`Startup profile saved.`);
      setView("discover");
      void myProfiles; // refresh subscription
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  async function joinInvestor(e: React.FormEvent) {
    e.preventDefault();
    if (iStages.length === 0 || iSectors.length === 0) {
      toast.error("Pick at least one stage and one sector.");
      return;
    }
    try {
      await upsertInvestor({
        orgName: iOrg,
        type: iType,
        thesis: iThesis,
        stages: iStages,
        sectors: iSectors,
        checkMin: iCheckMin ? Number.parseInt(iCheckMin, 10) : undefined,
        checkMax: iCheckMax ? Number.parseInt(iCheckMax, 10) : undefined,
      });
      toast.success("Investor profile saved.");
      setView("discover");
      void myProfiles;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="network" />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Sign in to browse the Deal Room.
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <p className="eyebrow">
                  Founders meet capital
                </p>
                <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
                  Deal Room
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Founders meet VCs, angels, incubators &amp; accelerators.
                  Transparent match scores, intros via credits.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={view === "discover" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("discover")}
                >
                  Discover
                </Button>
                <Button
                  variant={view === "join" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("join")}
                >
                  {myProfiles?.startup || myProfiles?.investor
                    ? "Edit profile"
                    : "Join the room"}
                </Button>
              </div>
            </header>

            {view === "join" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Rocket className="size-4 text-primary" />
                      {myProfiles?.startup ? "Edit your startup" : "List your startup"}
                    </div>
                    <form onSubmit={joinStartup} className="space-y-2">
                      <Input value={sName} onChange={(e) => setSN(e.target.value)} placeholder="Startup name" required />
                      <Input value={sTag} onChange={(e) => setST(e.target.value)} placeholder="One-line tagline" required />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={sSector} onChange={(e) => setSS(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                        <select value={sStage} onChange={(e) => setSSg(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                          {STAGES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <Input value={sAsk} onChange={(e) => setSA(e.target.value)} type="number" min={0} placeholder="Ask amount (USD, optional)" />
                      <textarea value={sPitch} onChange={(e) => setSP(e.target.value)} rows={3} placeholder="Elevator pitch (optional)" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                      <Button type="submit" className="w-full">
                        {myProfiles?.startup ? "Save changes" : "Create profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="size-4 text-primary" />
                      {myProfiles?.investor ? "Edit your investor profile" : "Join as investor"}
                    </div>
                    <form onSubmit={joinInvestor} className="space-y-2">
                      <Input value={iOrg} onChange={(e) => setIO(e.target.value)} placeholder="Organization / fund name" required />
                      <select
                        value={iType}
                        onChange={(e) =>
                          setIT(e.target.value as typeof iType)
                        }
                        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        {TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <textarea value={iThesis} onChange={(e) => setITh(e.target.value)} rows={2} placeholder="Investment thesis (what you back & why)" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" required />
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">Stages</div>
                        <div className="flex flex-wrap gap-1.5">
                          {STAGES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setIS((p) => (p.includes(st) ? p.filter((x) => x !== st) : [...p, st]))}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                                iStages.includes(st) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50",
                              )}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-muted-foreground">Sectors</div>
                        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setISec((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                                iSectors.includes(c.id) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50",
                              )}
                            >
                              {c.emoji} {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={iCheckMin} onChange={(e) => setICMin(e.target.value)} type="number" min={0} placeholder="Min check (USD)" />
                        <Input value={iCheckMax} onChange={(e) => setICMax(e.target.value)} type="number" min={0} placeholder="Max check (USD)" />
                      </div>
                      <Button type="submit" className="w-full">
                        {myProfiles?.investor ? "Save changes" : "Create profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-full border border-border/60 p-0.5">
                    <button
                      type="button"
                      onClick={() => setKind("startups")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs transition-colors",
                        kind === "startups" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                      )}
                    >
                      <Rocket className="mr-1 inline size-3" /> Startups
                    </button>
                    <button
                      type="button"
                      onClick={() => setKind("investors")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs transition-colors",
                        kind === "investors" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                      )}
                    >
                      <Building2 className="mr-1 inline size-3" /> Investors
                    </button>
                  </div>
                  <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                    <option value="">All stages</option>
                    {STAGES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                    <option value="">All sectors</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>

                {kind === "startups" ? (
                  startupList.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No startups here yet —{" "}
                      <Link className="underline" to="#" onClick={() => setView("join")}>
                        list yours
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {startupList.map((s) => (
                        <Link key={s._id} to={`/network/startup/${s._id}`}>
                          <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                            <CardContent className="space-y-2 pt-5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium leading-tight">{s.name}</div>
                                <Badge variant="outline">{s.stage}</Badge>
                              </div>
                              <p className="line-clamp-2 text-xs text-muted-foreground">{s.tagline}</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <Badge variant="secondary" className="text-[10px]">
                                  {getCategory(s.sector)?.emoji} {getCategory(s.sector)?.label}
                                </Badge>
                                {s.askAmount ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Ask ${s.askAmount.toLocaleString()}
                                  </Badge>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )
                ) : investorList.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No investors yet —{" "}
                    <Link className="underline" to="#" onClick={() => setView("join")}>
                      join as an investor
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {investorList.map((iv) => (
                      <Link key={iv._id} to={`/network/investor/${iv._id}`}>
                        <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                          <CardContent className="space-y-2 pt-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-medium leading-tight">
                                {iv.orgName}
                                {iv.verified && <BadgeCheck className="size-4 shrink-0 text-sky-400" />}
                              </div>
                              <Badge className={cn("text-[10px]", TYPE_BADGE[iv.type])}>{iv.type}</Badge>
                            </div>
                            <p className="line-clamp-2 text-xs text-muted-foreground">{iv.thesis}</p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {iv.sectors.slice(0, 3).map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px]">
                                  {getCategory(s)?.emoji} {getCategory(s)?.label}
                                </Badge>
                              ))}
                              {iv.checkMax ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Up to ${iv.checkMax.toLocaleString()}
                                </Badge>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(intros ?? []).length > 0 && (
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="size-4 text-primary" />
                    Your intros
                  </div>
                  <ul className="divide-y divide-border/60">
                    {(intros ?? []).map((i) => (
                      <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {i.counterpartyName}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {i.fromStartup ? "from startup" : "from investor"}
                            </span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{i.message}</div>
                        </div>
                        {i.status === "pending" && i.isInbound ? (
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await respond({ introId: i.id, accept: true });
                                  toast.success("Intro accepted.");
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed.");
                                }
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await respond({ introId: i.id, accept: false });
                                  toast.info("Intro declined.");
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed.");
                                }
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={i.status === "accepted" ? "secondary" : "outline"}>{i.status}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}