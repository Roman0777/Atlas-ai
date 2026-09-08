import { useEffect, useState } from "react";

/**
 * CoordinatesTicker — playful expedition-telemetry readout. Drifting
 * latitude/longitude + heading, styled like chart annotations.
 * Static when the user prefers reduced motion.
 */
export function CoordinatesTicker({ className }: { className?: string }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [pos, setPos] = useState({ lat: 12.9704, lon: 77.5946, hdg: 42 });

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setPos((p) => ({
        lat: clamp(p.lat + (Math.random() - 0.5) * 0.08, -78, 78),
        lon: clamp(p.lon + (Math.random() - 0.5) * 0.12, -179, 179),
        hdg: (p.hdg + (Math.random() - 0.5) * 8 + 360) % 360,
      }));
    }, 900);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <span className={`font-label inline-flex items-center gap-2 ${className ?? ""}`} aria-hidden>
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-primary opacity-60" />
        <span className="inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      LAT {Math.abs(pos.lat).toFixed(4)}° {pos.lat >= 0 ? "N" : "S"} · LON{" "}
      {Math.abs(pos.lon).toFixed(4)}° {pos.lon >= 0 ? "E" : "W"} · HDG{" "}
      {String(Math.round(pos.hdg)).padStart(3, "0")}°
    </span>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
