import { formatCents } from "@/lib/categories";
import { EASE } from "@/lib/motion";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Animated counter that counts up from 0 when scrolled into view.
 * Used for stats, totals, and hero numbers.
 */
export function AnimatedCounter({
  value,
  className,
  prefix = "",
  suffix = "",
  duration = 1.2,
  format = "number",
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: "number" | "cents";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // easeOutQuint
      const eased = 1 - Math.pow(1 - progress, 5);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  const formatted =
    format === "cents"
      ? `${prefix}${formatCents(Math.round(display))}${suffix}`
      : `${prefix}${Math.round(display).toLocaleString()}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}

/**
 * Animated stat card with counter + label + optional icon.
 */
export function StatCard({
  icon,
  label,
  value,
  prefix = "",
  suffix = "",
  accent = false,
  format = "number",
}: {
  icon?: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  accent?: boolean;
  format?: "number" | "cents";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: EASE }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} format={format} />
          </div>
          <div className="font-label text-[10px] text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
