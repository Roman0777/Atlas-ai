import {
  AtSign,
  Bitcoin,
  Bot,
  Boxes,
  Brain,
  Briefcase,
  ClipboardList,
  Code2,
  Compass,
  Crown,
  FileText,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Instagram,
  Linkedin,
  Mail,
  Megaphone,
  Mic,
  Music2,
  Newspaper,
  Palette,
  PenLine,
  Plane,
  Plug,
  Puzzle,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Telescope,
  Trophy,
  Twitch,
  User,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { createElement } from "react";

import { CATEGORIES, getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * Category icon registry.
 *
 * `lib/categories.ts` is imported by the Convex backend, so it can only hold
 * plain strings. This map is the client-side half: it turns those stable icon
 * names into a single, consistent line-icon language (no emoji anywhere).
 */
const ICONS: Record<string, LucideIcon> = {
  "at-sign": AtSign,
  bitcoin: Bitcoin,
  bot: Bot,
  box: Boxes,
  brain: Brain,
  briefcase: Briefcase,
  cart: ShoppingCart,
  clipboard: ClipboardList,
  code: Code2,
  compass: Compass,
  crown: Crown,
  "file-text": FileText,
  gamepad: Gamepad2,
  "git-branch": GitBranch,
  globe: Globe,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  home: Home,
  instagram: Instagram,
  linkedin: Linkedin,
  mail: Mail,
  megaphone: Megaphone,
  mic: Mic,
  music: Music2,
  newspaper: Newspaper,
  palette: Palette,
  pen: PenLine,
  plane: Plane,
  plug: Plug,
  puzzle: Puzzle,
  rocket: Rocket,
  scale: Scale,
  search: Search,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  target: Target,
  telescope: Telescope,
  trophy: Trophy,
  twitch: Twitch,
  user: User,
  youtube: Youtube,
};

/** Look up the lucide component for an icon key, with a safe fallback. */
export function categoryIcon(icon: string | undefined): LucideIcon {
  return (icon && ICONS[icon]) || Compass;
}

/**
 * Render a category's icon. Accepts either a category id (looked up in the
 * registry) or a raw icon key, so it works everywhere the old
 * `{cat.emoji}` interpolation used to appear.
 */
export function CategoryIcon({
  category,
  icon,
  className,
}: {
  category?: string;
  icon?: string;
  className?: string;
}) {
  const resolved = icon ?? (category ? getCategory(category)?.icon : undefined);
  // createElement (not <Icon/>) — assigning the looked-up component to a
  // capitalized local would trip react-hooks/static-components, since the
  // compiler can't prove the mapping is static.
  return createElement(ICONS[resolved ?? ""] ?? Compass, {
    className: cn("size-3.5", className),
    "aria-hidden": true,
  });
}

/** All category ids paired with their icon component — for pickers/tickers. */
export const CATEGORY_ICON_ENTRIES = CATEGORIES.map((c) => ({
  ...c,
  Icon: categoryIcon(c.icon),
}));
