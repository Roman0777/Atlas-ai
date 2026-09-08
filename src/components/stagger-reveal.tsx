import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * StaggerReveal — wraps children and staggers their entrance.
 * Drop-in replacement for motion.div with stagger.
 */
export function StaggerReveal({
  children,
  className,
  staggerDelay = 0.06,
  delay = 0,
  direction = "up",
  distance = 12,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  once?: boolean;
}) {
  const dirMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  const offset = dirMap[direction];

  return (
    <motion.div
      className={cn("flex flex-wrap", className)}
      variants={stagger(staggerDelay, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-30px" }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, ...offset },
                show: {
                  opacity: 1,
                  y: 0,
                  x: 0,
                  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * FadeInView — single element fade-in on scroll.
 */
export function FadeInView({
  children,
  className,
  delay = 0,
  duration = 0.5,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleInView — pop-in animation for cards/badges.
 */
export function ScaleInView({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, margin: "-30px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
