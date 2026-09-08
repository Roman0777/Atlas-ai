import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated progress bar — fills to target width when scrolled into view.
 * Used for rank progress, credit bars, completion tracking.
 */
export function ProgressBar({
  value,
  max = 100,
  className,
  color = "primary",
  showLabel = false,
  animated = true,
}: {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "gold" | "destructive" | "success";
  showLabel?: boolean;
  animated?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    primary: "bg-primary",
    gold: "bg-[#C9A227]",
    destructive: "bg-destructive",
    success: "bg-emerald-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-mono tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", colorMap[color])}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          whileInView={animated ? { width: `${pct}%` } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/**
 * Rank progress — shows how close you are to overtaking the next rank.
 */
export function RankProgress({
  current,
  target,
  currentRank,
  targetRank,
  className,
}: {
  current: number;
  target: number;
  currentRank: number;
  targetRank: number;
  className?: string;
}) {
  const diff = target - current;
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          #{currentRank} → #{targetRank}
        </span>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          ${diff > 0 ? diff / 100 : 0} to overtake
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
