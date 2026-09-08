import { cn } from "@/lib/utils";

/**
 * PassportStamps — "expedition log" for the daily renewal streak. Each
 * claimed day in the current streak fills a stamp slot; the full row
 * earns a gold wax-seal. Pure presentation — streak comes from getWallet.
 */
export function PassportStamps({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  const SLOTS = 7;
  const filled = Math.min(streak, SLOTS);
  const sealed = streak >= SLOTS;

  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between">
        <p className="font-label text-[10px] tracking-[0.18em] text-muted-foreground">
          EXPEDITION LOG · LAST 7 DAYS
        </p>
        <p className="font-label text-[10px] text-muted-foreground">
          {streak}-DAY STREAK
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5 sm:gap-3">
        {Array.from({ length: SLOTS }).map((_, i) => {
          const isFilled = i < filled;
          const isNext = i === filled;
          return (
            <div
              key={i}
              className={cn(
                "relative grid h-12 flex-1 place-items-center rounded-lg border-2 border-dashed transition-all duration-300 sm:h-14",
                isFilled
                  ? "border-primary/50 bg-primary/[0.07]"
                  : isNext
                    ? "animate-pulse border-primary/40 bg-primary/[0.03]"
                    : "border-border/70 bg-muted/30",
              )}
              title={isFilled ? `Day ${i + 1} claimed` : isNext ? "Next claim lands here" : "Not yet claimed"}
            >
              {isFilled ? (
                <span
                  className="font-label rotate-[-8deg] text-[8px] font-semibold tracking-wider"
                  style={{ color: "var(--primary)" }}
                >
                  DAY {i + 1}
                </span>
              ) : (
                <span className="text-[10px] opacity-30">✕</span>
              )}
            </div>
          );
        })}

        {/* wax seal — completes at 7-day streak */}
        <div
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full border-2 transition-all duration-500 sm:size-16",
            sealed
              ? "rotate-0 border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] opacity-100"
              : "rotate-12 border-border/60 opacity-35",
          )}
          title={sealed ? "7-day streak sealed!" : "Fill 7 days to earn the seal"}
        >
          <span
            className="font-label text-center text-[7px] leading-tight tracking-widest"
            style={{ color: sealed ? "var(--gold, #C9A227)" : undefined }}
          >
            {sealed ? "SEALED" : "7 DAY"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Claim your daily renewal to stamp a day — miss one and the log resets.
      </p>
    </div>
  );
}
