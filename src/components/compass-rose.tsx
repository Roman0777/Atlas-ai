import { cn } from "@/lib/utils";

/**
 * CompassRose — slowly rotating SVG compass ornament. Pure decoration,
 * themed with the Ocean & Land palette (teal needle, gold ring).
 */
export function CompassRose({
  className,
  spin = true,
}: {
  className?: string;
  spin?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("pointer-events-none select-none", spin && "compass-rose", className)}
    >
      {/* outer ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" />
      {/* tick marks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 16;
        const x1 = 50 + Math.sin(a) * 41;
        const y1 = 50 - Math.cos(a) * 41;
        const x2 = 50 + Math.sin(a) * 45;
        const y2 = 50 - Math.cos(a) * 45;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        );
      })}
      {/* cardinal points — long diamonds */}
      {["N", "E", "S", "W"].map((dir, i) => {
        const rot = i * 90;
        return (
          <g key={dir} transform={`rotate(${rot} 50 50)`}>
            <polygon points="50,10 54,50 50,54 46,50" fill="var(--primary, #1F6F5C)" opacity="0.75" />
            <polygon points="50,6 52.5,18 47.5,18" fill="var(--gold, #C9A227)" opacity="0.9" />
          </g>
        );
      })}
      {/* intercardinal — short diamonds */}
      {[45, 135, 225, 315].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 50 50)`}>
          <polygon points="50,24 52.5,50 50,52.5 47.5,50" fill="currentColor" opacity="0.3" />
        </g>
      ))}
      {/* center */}
      <circle cx="50" cy="50" r="4" fill="var(--gold, #C9A227)" opacity="0.9" />
      <circle cx="50" cy="50" r="1.6" fill="var(--background, #EEF2EA)" />
    </svg>
  );
}
