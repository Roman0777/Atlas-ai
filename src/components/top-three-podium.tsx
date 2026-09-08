"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedCents } from "@/components/animated-number";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { Crown, ExternalLink, Shield, Swords, Star, Lock } from "lucide-react";

interface Listing {
  _id: string;
  ownerId: string;
  title: string;
  url: string;
  tagline?: string;
  category: string;
  totalPaid: number;
  starCount: number;
  referralCreditCents?: number;
  isLocked: boolean;
  rank: number;
  ownerName?: string;
  ownerImage?: string;
  featured?: boolean;
  featuredUntil?: number;
}

function faviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

// Precomputed ONCE at module load — random positions/durations must not be
// re-rolled during render (every re-render would make the sparks jump = lag).
interface GlowSpark {
  left: string;
  top: string;
  y: [number, number, number];
  duration: number;
  delay: number;
}

const GLOW_SPARKS: GlowSpark[] = Array.from({ length: 12 }, () => ({
  left: `${15 + Math.random() * 70}%`,
  top: `${10 + Math.random() * 80}%`,
  y: [0, -20 - Math.random() * 30, 0],
  duration: 2 + Math.random() * 2,
  delay: Math.random() * 3,
}));

/** Floating particles around the #1 spot */
function GlowParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {GLOW_SPARKS.map((spark, i) => (
        <motion.div
          key={i}
          className="absolute size-1 rounded-full bg-primary/40"
          style={{
            left: spark.left,
            top: spark.top,
          }}
          animate={{
            y: spark.y,
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: spark.duration,
            repeat: Infinity,
            delay: spark.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Single podium pedestal */
function Pedestal({
  listing,
  rank,
  isMine,
  onPay,
  onDetail,
  delay,
}: {
  listing: Listing;
  rank: 1 | 2 | 3;
  isMine: boolean;
  onPay: (l: Listing, kind: "boost" | "dislike") => void;
  onDetail: () => void;
  delay: number;
}) {
  const fav = faviconUrl(listing.url);
  const isTop = rank === 1;
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const glowColors = {
    1: "shadow-primary/20 border-primary/40",
    2: "shadow-muted-foreground/10 border-border/60",
    3: "shadow-muted-foreground/10 border-border/60",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
      style={{ perspective: "800px" }}
    >
      {/* Card */}
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative w-full max-w-[220px] rounded-2xl border bg-card p-4 ${
          glowColors[rank]
        } ${isTop ? "shadow-xl ring-2 ring-primary/20" : "shadow-md"}`}
      >
        {isTop && <GlowParticles />}

        {/* Rank badge */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl">{medals[rank]}</span>
          {listing.isLocked && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Lock className="size-3" /> Locked
            </span>
          )}
        </div>

        {/* Favicon + title */}
        <div className="flex items-center gap-2">
          {fav && (
            <img
              src={fav}
              alt=""
              className="size-5 shrink-0 rounded-sm"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <button
            type="button"
            onClick={onDetail}
            className="truncate text-left text-sm font-bold hover:text-primary"
          >
            {listing.title}
          </button>
        </div>

        {/* Tagline */}
        {listing.tagline && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {listing.tagline}
          </p>
        )}

        {/* Money + stars */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <AnimatedCents
              value={listing.totalPaid}
              className={`type-data ${isTop ? "text-xl text-primary" : "text-lg text-foreground"}`}
            />
            <div className="font-label text-[9px] text-muted-foreground">banked</div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="size-3 fill-primary/30 text-primary/50" />
            {listing.starCount}
          </div>
        </div>

        {/* Owner */}
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/50 pt-2">
          {listing.ownerImage && (
            <img
              src={listing.ownerImage}
              alt=""
              className="size-4 rounded-full"
              loading="lazy"
            />
          )}
          <span className="truncate text-[10px] text-muted-foreground/70">
            {listing.ownerName ?? "anon"}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-1.5">
          {isMine ? (
            <Button
              size="sm"
              className="w-full gap-1 text-[11px]"
              onClick={() => onPay(listing, "boost")}
            >
              <Shield className="size-3" /> Defend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="w-full gap-1 text-[11px]"
              onClick={() => onPay(listing, "dislike")}
            >
              <Swords className="size-3" /> Knock down
            </Button>
          )}
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-border/60 px-2 transition hover:bg-accent"
          >
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>
        </div>
      </motion.div>

      {/* Pedestal base */}
      <div
        className={`-mt-1 w-full max-w-[220px] rounded-b-xl ${
          isTop
            ? "h-10 bg-gradient-to-b from-primary/15 to-primary/5"
            : rank === 2
              ? "h-7 bg-gradient-to-b from-secondary/40 to-secondary/10"
              : "h-5 bg-gradient-to-b from-secondary/30 to-secondary/5"
        }`}
      />
    </motion.div>
  );
}

/**
 * TopThreePodium — 3D podium showcase for the top 3 listings.
 * #1 center (tallest), #2 left, #3 right.
 * Glowing particles, staggered entrance, premium feel.
 */
export function TopThreePodium({
  listings,
  myIds,
  onPay,
  onDetail,
}: {
  listings: Listing[];
  myIds: Set<string>;
  onPay: (l: Listing, kind: "boost" | "dislike") => void;
  onDetail: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (listings.length < 3) return null;

  const [first, second, third] = listings;

  return (
    <div ref={ref} className="mb-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 text-center"
      >
        <p className="font-label flex items-center justify-center gap-2 text-xs font-medium text-primary">
          <Crown className="size-3.5" />
          TOP THREE
        </p>
        <h2 className="type-display mt-2">The podium.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The top three spots on this board. Fight for a seat.
        </p>
      </motion.div>

      {/* 3D Podium — perspective container */}
      <div
        className="flex items-end justify-center gap-3 px-4 sm:gap-5"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 70%" }}
      >
        {/* #2 — left */}
        <motion.div
          className="w-full max-w-[200px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Pedestal
            listing={second}
            rank={2}
            isMine={myIds.has(second._id)}
            onPay={onPay}
            onDetail={() => onDetail(second._id)}
            delay={0.2}
          />
        </motion.div>

        {/* #1 — center, elevated */}
        <motion.div
          className="w-full max-w-[240px]"
          style={{ transformStyle: "preserve-3d", marginBottom: "8px" }}
        >
          <Pedestal
            listing={first}
            rank={1}
            isMine={myIds.has(first._id)}
            onPay={onPay}
            onDetail={() => onDetail(first._id)}
            delay={0}
          />
        </motion.div>

        {/* #3 — right */}
        <motion.div
          className="w-full max-w-[200px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Pedestal
            listing={third}
            rank={3}
            isMine={myIds.has(third._id)}
            onPay={onPay}
            onDetail={() => onDetail(third._id)}
            delay={0.35}
          />
        </motion.div>
      </div>
    </div>
  );
}
