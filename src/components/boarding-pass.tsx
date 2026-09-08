import type { ReactNode } from "react";
import { CompassRose } from "@/components/compass-rose";
import { cn } from "@/lib/utils";

/**
 * BoardingPass — expedition-ticket styled CTA band. Perforated stub,
 * mono "ADMIT ONE" labels, dashed barcode, and a wax-seal-style stamp
 * that presses in on hover. Playful but editorial.
 */
export function BoardingPass({
  title,
  body,
  actions,
  serial = "000042",
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  actions: ReactNode;
  serial?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative mx-auto flex max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-card shadow-elevated sm:flex-row",
        className,
      )}
    >
      {/* main ticket */}
      <div className="flex-1 p-8 sm:p-10">
        <p className="font-label text-[10px] tracking-[0.2em] text-primary">
          ATLAS EXPEDITION · ADMIT ONE
        </p>
        <div className="mt-3">{title}</div>
        <div className="mt-3">{body}</div>
        <div className="mt-6">{actions}</div>
      </div>

      {/* perforated stub */}
      <div className="relative border-t-2 border-dashed border-primary/30 sm:border-l-2 sm:border-t-0">
        {/* notch circles — the perforation */}
        <span className="absolute -top-4 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-dashed border-primary/30 bg-background sm:-left-4 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2" />
        <span className="absolute -bottom-4 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-dashed border-primary/30 bg-background sm:-left-4 sm:bottom-auto sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2" />
        <div className="flex items-center justify-center gap-6 px-10 py-8 sm:h-full sm:w-44 sm:flex-col sm:gap-5 sm:px-6">
          {/* barcode */}
          <div
            aria-hidden
            className="h-10 w-36 opacity-40 sm:h-24 sm:w-10"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--foreground) 0 2px, transparent 2px 5px, var(--foreground) 5px 6px, transparent 6px 11px)",
            }}
          />
          <div className="text-center">
            <p className="font-label text-[9px] opacity-60">NO. {serial}</p>
            <p className="font-label mt-1 text-[9px] opacity-60">CLASSE EXPEDITION</p>
          </div>
          {/* stamp — presses in on ticket hover */}
          <div className="relative grid size-16 place-items-center">
            <CompassRose className="absolute inset-0 opacity-70" spin={false} />
            <span
              className="font-label rotate-[-14deg] text-[7px] tracking-widest opacity-40 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:opacity-90"
              style={{ color: "var(--gold, #C9A227)" }}
            >
              APPROVED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
