import { cn } from "@/lib/utils";

/**
 * RankBadge — a rendered medal for podium positions 1–3.
 *
 * Replaces the 🥇🥈🥉 emoji, which rendered as a different glyph on every
 * platform (and as a flat cartoon on Windows). This is a pure CSS/SVG medal:
 * a metallic disc with a ribbon and the placement number, tinted per rank so
 * gold / silver / bronze stay legible and on-brand.
 */

const RANK_STYLES = {
  1: {
    // Gold — warm ochre, the brand's premium accent
    disc: "from-[#F7E7A8] via-[#D9B36A] to-[#8C6612]",
    rim: "ring-[#B08D1E]/55",
    text: "text-[#4A3409]",
    ribbon: "#C9A227",
    shadow: "shadow-[0_2px_10px_-2px_rgba(201,162,39,0.55)]",
  },
  2: {
    // Silver — cool neutral, clearly subordinate to gold but still metallic
    disc: "from-[#FBFCFC] via-[#CBD4D1] to-[#7C8A85]",
    rim: "ring-[#6F857D]/50",
    text: "text-[#2A3833]",
    ribbon: "#8AA69C",
    shadow: "shadow-[0_2px_10px_-2px_rgba(110,133,125,0.5)]",
  },
  3: {
    // Bronze — muted copper
    disc: "from-[#F5DCC2] via-[#C4854A] to-[#6B451F]",
    rim: "ring-[#9A6432]/50",
    text: "text-[#3D2510]",
    ribbon: "#B5763E",
    shadow: "shadow-[0_2px_10px_-2px_rgba(154,100,50,0.5)]",
  },
} as const;

export function RankBadge({
  rank,
  size = "md",
  className,
}: {
  rank: number;
  /** sm = 24px (globe pins) · md = 32px (cards) · lg = 44px (podium) */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const style = RANK_STYLES[rank as 1 | 2 | 3];
  if (!style) return null;

  const dims = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-11 text-base",
  }[size];

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", dims, className)}
      title={`Rank ${rank}`}
      aria-label={`Rank ${rank}`}
    >
      {/* Ribbon tail behind the disc */}
      <span
        aria-hidden
        className="absolute bottom-[-3px] left-1/2 h-2 w-[45%] -translate-x-1/2 rounded-b-[3px] opacity-80"
        style={{ background: style.ribbon }}
      />
      {/* Medal disc — layered gradient + inset highlight reads as metal */}
      <span
        className={cn(
          "relative grid size-full place-items-center rounded-full bg-gradient-to-br ring-1",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.18)]",
          style.disc,
          style.rim,
          style.shadow,
        )}
      >
        <span className={cn("font-bold tabular-nums leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]", style.text)}>{rank}</span>
      </span>
    </span>
  );
}

/** Inline dot for non-podium ranks in dense lists. */
export function RankNumber({ rank, className }: { rank: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-6 shrink-0 place-items-center rounded-full border border-border/60",
        "font-mono text-[11px] font-semibold tabular-nums text-muted-foreground",
        className,
      )}
    >
      {rank}
    </span>
  );
}
