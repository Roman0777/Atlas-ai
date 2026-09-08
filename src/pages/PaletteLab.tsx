import { AtlasGlobeHeroLazy } from "@/components/atlas-globe-lazy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Flame, Star, Coins, Swords } from "lucide-react";

/**
 * DEV-ONLY: /palette — live palette lab for the "Nature World Atlas" theme.
 * Renders real app components + a recolored mini 3D globe under each
 * candidate palette. Remove after the palette decision.
 */

interface Option {
  key: "ocean" | "forest" | "oceanReward";
  name: string;
  tagline: string;
  vars: Record<string, string>;
  swatches: [string, string][];
}

const OPTIONS: Option[] = [
  {
    key: "ocean",
    name: "Option 1 · Ocean & Land",
    tagline: "TEAL PRIMARY · MOSS ACCENT · OCHRE HIGHLIGHTS",
    vars: {
      "--background": "#EEF2EA",
      "--foreground": "#132A2E",
      "--card": "#FBF9F2",
      "--card-foreground": "#132A2E",
      "--primary": "#1F6F5C",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A8C08A",
      "--accent-foreground": "#132A2E",
      "--secondary": "#E3E9DA",
      "--secondary-foreground": "#132A2E",
      "--muted": "#E5EADF",
      "--muted-foreground": "#5C6B62",
      "--border": "#D5DDCB",
      "--input": "#D5DDCB",
      "--ring": "#1F6F5C",
    },
    swatches: [
      ["#EEF2EA", "bg"],
      ["#132A2E", "ink"],
      ["#1F6F5C", "primary"],
      ["#A8C08A", "accent"],
      ["#C9A227", "gold"],
      ["#FBF9F2", "card"],
    ],
  },
  {
    key: "forest",
    name: "Option 2 · Deep Forest",
    tagline: "EMERALD PRIMARY · FERN ACCENT · SAND HIGHLIGHTS",
    vars: {
      "--background": "#F0F2EB",
      "--foreground": "#15241C",
      "--card": "#FAFBF6",
      "--card-foreground": "#15241C",
      "--primary": "#2E5E43",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#9BC29B",
      "--accent-foreground": "#15241C",
      "--secondary": "#E2E8DF",
      "--secondary-foreground": "#15241C",
      "--muted": "#E4E9E2",
      "--muted-foreground": "#5E6B60",
      "--border": "#D2DCCF",
      "--input": "#D2DCCF",
      "--ring": "#2E5E43",
    },
    swatches: [
      ["#F0F2EB", "bg"],
      ["#15241C", "ink"],
      ["#2E5E43", "primary"],
      ["#9BC29B", "accent"],
      ["#D9B36A", "sand"],
      ["#FAFBF6", "card"],
    ],
  },
];

const OPTION_3: Option = {
  key: "oceanReward",
  name: "Option 3 · Ocean & Land + Reward Orange",
  tagline: "TEAL UI · ORANGE RESERVED FOR STREAKS / REWARDS / MEDALS",
  vars: {
    "--background": "#EEF2EA",
    "--foreground": "#132A2E",
    "--card": "#FBF9F2",
    "--card-foreground": "#132A2E",
    "--primary": "#1F6F5C",
    "--primary-foreground": "#FFFFFF",
    "--accent": "#A8C08A",
    "--accent-foreground": "#132A2E",
    "--secondary": "#E3E9DA",
    "--secondary-foreground": "#132A2E",
    "--muted": "#E5EADF",
    "--muted-foreground": "#5C6B62",
    "--border": "#D5DDCB",
    "--input": "#D5DDCB",
    "--ring": "#1F6F5C",
  },
  swatches: [
    ["#EEF2EA", "bg"],
    ["#1F6F5C", "primary"],
    ["#A8C08A", "accent"],
    ["#E8633A", "rewards"],
    ["#C9A227", "gold"],
    ["#FBF9F2", "card"],
  ],
};
OPTIONS.push(OPTION_3);

function PaletteSection({ opt, index }: { opt: Option; index: number }) {
  return (
    <section
      className="border-b border-stone-300/60 py-12"
      style={{ background: "var(--background)", color: "var(--foreground)", ...opt.vars } as React.CSSProperties}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="type-display">{opt.name}</h2>
            <p className="font-label mt-1 text-[10px] opacity-60">{opt.tagline}</p>
          </div>
          <div className="flex gap-2">
            {opt.swatches.map(([hex, label]) => (
              <div key={hex} className="text-center">
                <div
                  className="size-10 rounded-lg border-2 border-black/10 shadow-sm"
                  style={{ background: hex }}
                />
                <span className="font-label mt-1 block text-[8px] opacity-60">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_320px]">
          {/* Real component samples */}
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Button size="lg">Boost to #1</Button>
              <Button size="lg" variant="outline">
                List a product
              </Button>
              <Button size="lg" variant="secondary">
                Star for free
              </Button>
            </div>

            <Card className="shadow-card">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-label text-[10px] opacity-60">BOARD SNAPSHOT</span>
                  <Badge variant="outline" className="gap-1">
                    <Crown className="size-3" /> #1 today
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    🥇 Verdant.ai
                    <Star className="size-3.5 fill-current opacity-40" />
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">$4.20</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    🥈 Rival.dev
                    <Swords className="size-3.5 opacity-40" />
                  </span>
                  <span className="font-mono text-sm">$3.85</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: opt.key === "oceanReward" ? "#E8633A" : "var(--primary)" }}
                  >
                    <Flame className="size-3.5" /> 6-day streak · claim +120
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold">
                    <Coins className="size-3.5" /> 1,250 credits
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live recolored mini globe */}
          <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center">
            <AtlasGlobeHeroLazy size={260} palette={opt.key} className="relative" />
          </div>
        </div>

        <p className="font-label mt-8 text-center text-[10px] opacity-50">
          OPTION {index + 1} — DRAG THE GLOBE · ALL COMPONENTS ABOVE LIVE-RECOLORED
        </p>
      </div>
    </section>
  );
}

export default function PaletteLab() {
  return (
    <div className="min-h-screen" style={{ background: "#E9E9E4" }}>
      <header className="py-14 text-center">
        <p className="font-label text-[11px] tracking-[0.2em] text-stone-500">
          WORLD ATLAS · NATURE THEME LAB
        </p>
        <h1 className="type-display-lg mt-2" style={{ color: "#1C2B24" }}>
          Choose the expedition colors.
        </h1>
        <p className="mx-auto mt-3 max-w-xl px-6 text-sm text-stone-600">
          Three nature palettes applied to real components and a live 3D globe.
          Scroll, compare, drag the globes — then tell Cline which one wins
          (1, 2, or 3) and the whole app gets recolored to match.
        </p>
      </header>
      {OPTIONS.map((opt, i) => (
        <PaletteSection key={opt.key} opt={opt} index={i} />
      ))}
      <footer className="py-10 text-center text-xs text-stone-500">
        Dev-only preview · /palette route will be removed after the decision.
      </footer>
    </div>
  );
}