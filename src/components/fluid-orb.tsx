"use client";

import { cn } from "@/lib/utils";

interface OrbProps {
  className?: string;
  color?: string;
  size?: number;
  delay?: number;
}

function Orb({ className, color = "bg-primary/20", size = 300, delay = 0 }: OrbProps) {
  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl opacity-40 animate-float",
        color,
        className,
      )}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
      aria-hidden
    />
  );
}

export function FluidOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Orb
        className="top-20 left-[10%]"
        color="bg-primary/15"
        size={400}
        delay={0}
      />
      <Orb
        className="top-40 right-[15%]"
        color="bg-accent/20"
        size={300}
        delay={2}
      />
      <Orb
        className="bottom-20 left-[30%]"
        color="bg-primary/10"
        size={350}
        delay={4}
      />
    </div>
  );
}

/** Single decorative orb for section backgrounds. */
export function SectionOrb({
  position = "right",
  className,
}: {
  position?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -top-32 size-[28rem] rounded-full border-[3rem] border-accent/30 opacity-60",
        position === "right" ? "-right-32" : "-left-32",
        "animate-float-delayed",
        className,
      )}
      aria-hidden
    />
  );
}
