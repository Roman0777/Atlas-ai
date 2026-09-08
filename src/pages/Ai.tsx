import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
import {
  Bot,
  Coins,
  Cpu,
  History,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const AI_MARGIN = 1.5;
const AI_MIN_CHARGE = 1;

function estimateCredits(
  pricingInPerM: number,
  pricingOutPerM: number,
  promptChars: number,
  maxTokens = 800,
) {
  const usd =
    (promptChars / 4 / 1e6) * pricingInPerM + (maxTokens / 1e6) * pricingOutPerM;
  return Math.max(AI_MIN_CHARGE, Math.ceil(usd * 100 * AI_MARGIN));
}

export default function Ai() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const agents = useQuery(api.aiCatalog.listAgents);
  const catalog = useQuery(api.aiCatalog.listModels);
  const runs = useQuery(api.aiCatalog.getMyRuns);
  const runModel = useAction(api.ai.runModel);
  const syncModels = useAction(api.ai.syncModels);

  const [agentSlug, setAgentSlug] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [freeform, setFreeform] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const agent = agents?.find((a) => a.slug === agentSlug) ?? null;
  const models = useMemo(() => catalog?.models ?? [], [catalog]);

  // Effective model: the user's pick while it's still valid, otherwise a sane
  // default (agent's preferred model, then first catalog entry). Derived
  // during render — no effect needed.
  const effectiveModelId =
    modelId && models.some((m) => m.id === modelId)
      ? modelId
      : (agent?.defaultModel ?? models[0]?.id ?? "");

  // Refresh the OpenRouter catalog when the cache is stale.
  useEffect(() => {
    if (isAuthenticated && catalog?.stale) void syncModels();
  }, [isAuthenticated, catalog?.stale, syncModels]);

  const selectedPricing = models.find((m) => m.id === effectiveModelId);
  const estCredits = useMemo(() => {
    if (!selectedPricing) return 0;
    const chars =
      agentSlug && agent
        ? agent.fields.reduce(
            (n, f) => n + f.label.length + (values[f.key]?.length ?? 4) + 2,
            agent.system.length,
          )
        : freeform.length;
    return estimateCredits(
      selectedPricing.pricingInPerM,
      selectedPricing.pricingOutPerM,
      chars,
    );
  }, [selectedPricing, agent, agentSlug, values, freeform]);

  async function onRun() {
    setRunning(true);
    setOutput(null);
    setMeta(null);
    try {
      const res = await runModel({
        agentSlug: agentSlug ?? undefined,
        model: effectiveModelId || undefined,
        values: agentSlug ? values : undefined,
        prompt: agentSlug ? undefined : freeform,
      });
      setOutput(res.text || "(empty response)");
      setMeta(
        `${res.model} · ${res.tokensIn}+${res.tokensOut} tokens · charged ${res.charged} cr${
          res.refunded > 0 ? ` (refunded ${res.refunded})` : ""
        } · ${(res.latencyMs / 1000).toFixed(1)}s · balance ${res.balance.toLocaleString()}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="ai" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {authLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Sign in to use AI credits.
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
                  <Sparkles className="size-6 text-primary" />
                  AI Studio
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every model, billed per token from your credit wallet — with
                  automatic refunds for over-estimates.
                </p>
              </div>
              {catalog?.source === "openrouter" && (
                <Badge variant="secondary">
                  <Cpu className="mr-1 size-3" />
                  {models.length} models live
                </Badge>
              )}
            </header>

            <div className="grid gap-4 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="text-sm font-medium">1 · Model</div>
                    <select
                      value={effectiveModelId}
                      onChange={(e) => setModelId(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name ?? m.id} — ${m.pricingInPerM}/${m.pricingOutPerM} per 1M tokens
                        </option>
                      ))}
                    </select>
                    {selectedPricing && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPricing.id}
                        {selectedPricing.contextLength
                          ? ` · ${Math.round(selectedPricing.contextLength / 1000)}k context`
                          : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="text-sm font-medium">2 · Task</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAgentSlug(null);
                          setModelId(models[0]?.id ?? "");
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          agentSlug === null
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <Wand2 className="size-4 shrink-0 text-primary" />
                        <span className="font-medium">Freeform</span>
                      </button>
                      {(agents ?? []).map((a) => (
                        <button
                          key={a.slug}
                          type="button"
                          title={a.description}
                          onClick={() => {
                            setAgentSlug(a.slug);
                            setModelId(a.defaultModel);
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                            agentSlug === a.slug
                              ? "border-primary bg-primary/10"
                              : "hover:bg-muted/50",
                          )}
                        >
                          <span className="shrink-0">{a.emoji}</span>
                          <span className="font-medium leading-tight">{a.name}</span>
                        </button>
                      ))}
                    </div>
                    {agent && (
                      <p className="text-xs text-muted-foreground">
                        <Bot className="mr-1 inline size-3" />
                        {agent.description}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">3 · Input</div>
                      <Badge variant="outline" className="gap-1">
                        <Coins className="size-3 text-amber-500" />≈ {estCredits} cr
                      </Badge>
                    </div>
                    {agent ? (
                      <div className="space-y-2">
                        {agent.fields.map((f) => (
                          <div key={f.key}>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              {f.label}
                            </label>
                            <Input
                              value={values[f.key] ?? ""}
                              onChange={(e) =>
                                setValues((v) => ({ ...v, [f.key]: e.target.value }))
                              }
                              placeholder={f.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={freeform}
                        onChange={(e) => setFreeform(e.target.value)}
                        rows={5}
                        placeholder="Ask anything — the model answers with your chosen pricing."
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      />
                    )}
                    <Button className="w-full" onClick={onRun} disabled={running}>
                      {running ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 size-4" />
                      )}
                      Run (≈ {estCredits} credits)
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 lg:col-span-2">
                <Card className="min-h-[280px]">
                  <CardContent className="space-y-3 pt-6">
                    <div className="text-sm font-medium">Output</div>
                    {output === null && !running && (
                      <p className="py-10 text-center text-xs text-muted-foreground">
                        Pick a task, fill the inputs and hit Run — results land
                        here and in your history.
                      </p>
                    )}
                    {running && (
                      <div className="flex justify-center py-10">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {output !== null && !running && (
                      <>
                        <div className="whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                          {output}
                        </div>
                        {meta && (
                          <p className="text-[10px] text-muted-foreground">{meta}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <History className="size-4 text-primary" />
                      Recent runs
                    </div>
                    {runs === undefined || runs.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        No AI runs yet.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {runs.map((r) => (
                          <li
                            key={r._id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {r.agentSlug ?? "Freeform"}
                              </div>
                              <div className="truncate text-muted-foreground">
                                {r.model}
                              </div>
                            </div>
                            <div className="shrink-0 text-right text-muted-foreground">
                              <div className="tabular-nums">
                                {r.tokensIn}+{r.tokensOut} tok
                              </div>
                              <div className="tabular-nums text-amber-500">
                                −{r.creditsCharged} cr
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
