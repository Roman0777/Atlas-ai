import { formatCents } from "@/lib/categories";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Money value that glides to its target with a spring instead of snapping.
 * Convex subscriptions update totals live — this makes every boost visibly
 * roll the number forward (and every sabotage roll it back).
 */
export function AnimatedCents({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 120, damping: 22 });
  const text = useTransform(spring, (v) => formatCents(Math.round(v)));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
