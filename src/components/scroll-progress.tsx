import { motion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgress — thin "flight path" bar pinned to the top of the viewport.
 * A teal→ochre gradient fills as you scroll, like tracing a route on a map.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, var(--primary), #2FAE8F 55%, var(--gold, #C9A227))",
      }}
    />
  );
}
