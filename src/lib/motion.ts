import type { Transition, Variants } from "framer-motion";

/** Signature ease — fast start, long silky settle (easeOutQuint-ish). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** For physical, interactive elements (pills, stars, toggles). */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 32,
  mass: 0.9,
};

/** For larger surfaces (cards, rows). */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 210,
  damping: 26,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

/** Parent that staggers its `fadeUp`-style children. */
export const stagger = (staggerChildren = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Staggered item tuned for lists (board rows, feed items). */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};
