import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-foreground dark:bg-card/70 border-border/70 h-11 w-full min-w-0 rounded-xl border bg-card/60 px-4 py-2 text-[15px] shadow-[inset_0_1px_3px_oklch(0.25_0.04_175/0.07)] backdrop-blur transition-[border-color,box-shadow,background-color] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[inset_0_1px_3px_oklch(0.05_0.02_175/0.45)] dark:hover:bg-card/90",
        "hover:border-primary/40",
        "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:bg-card",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
