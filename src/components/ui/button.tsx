import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0.2_0.04_170/0.22),0_8px_20px_-8px_var(--primary)] hover:bg-primary/90 hover:shadow-[0_1px_2px_oklch(0.2_0.04_170/0.22),0_12px_28px_-10px_var(--primary)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:bg-destructive/70 shadow-[0_8px_20px_-10px_var(--destructive)]",
        outline:
          "border border-border/70 bg-card text-card-foreground shadow-[0_1px_2px_oklch(0.2_0.04_175/0.08)] hover:border-primary/40 hover:bg-accent/60 hover:text-accent-foreground dark:bg-card/80 dark:hover:bg-card",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur hover:bg-secondary",
        ghost:
          "rounded-full text-foreground/80 hover:bg-muted/80 hover:text-foreground dark:hover:bg-muted/40",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        sheen: "bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0.2_0.04_170/0.22),0_8px_20px_-8px_var(--primary)] hover:bg-primary/90 sheen-on-hover",
        metal:
          "border border-border/70 bg-gradient-to-b from-card via-card to-secondary/80 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_oklch(0.25_0.04_175/0.1)] hover:border-primary/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_24px_-12px_oklch(0.25_0.04_175/0.18)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(220,231,222,0.12),0_1px_2px_oklch(0.05_0.02_175/0.4)] dark:hover:shadow-[inset_0_1px_0_rgba(220,231,222,0.12),0_10px_24px_-12px_oklch(0.05_0.02_175/0.55)]",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-full gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-full px-7 has-[>svg]:px-5 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
