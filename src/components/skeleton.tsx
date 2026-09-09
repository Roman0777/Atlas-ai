"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
    </div>
  );
}

/** Board row skeleton — mimics the shape of a real ranking row. */
export function BoardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Shimmer className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="h-6 w-16" />
    </div>
  );
}

/** Board loading state — multiple rows with staggered shimmer. */
export function BoardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-border/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 100}ms` }}
          className="animate-pulse"
        >
          <BoardRowSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Stats skeleton — mimics stat chips. */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/60 bg-card/80 p-3">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="mt-2 h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Spotlight skeleton — the #1 card. */
export function SpotlightSkeleton() {
  return (
    <div className="mb-6 rounded-xl border border-border/70 bg-accent/20 p-4">
      <div className="flex items-center gap-3">
        <Shimmer className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/** Card skeleton — for dashboard listings or job cards. */
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Shimmer className="h-5 w-12 rounded-full" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Shimmer className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/** Pulse dot — live indicator. */
export function PulseDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)}>
      <span className="absolute inline-flex size-2 animate-ping rounded-full bg-primary opacity-60" />
      <span className="inline-flex size-2 rounded-full bg-primary" />
    </span>
  );
}

/** News row skeleton — mimics a story row (source line + title + summary). */
export function NewsRowSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/60 p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-3 w-40" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-2/3" />
      </div>
      <Shimmer className="size-20 shrink-0 rounded-lg" />
    </div>
  );
}

/** News loading state — six staggered story rows. */
export function NewsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 100}ms` }}
          className="animate-pulse"
        >
          <NewsRowSkeleton />
        </div>
      ))}
    </div>
  );
}
