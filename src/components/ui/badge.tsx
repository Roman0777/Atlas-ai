import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none transition-[color,box-shadow,background-color,border-color] duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[0_2px_8px_-3px_var(--primary)] [a&]:hover:bg-primary/90",
        secondary:
          "border-border/50 bg-secondary/70 text-secondary-foreground backdrop-blur [a&]:hover:bg-secondary",
        destructive:
          "border-transparent bg-destructive/90 text-white [a&]:hover:bg-destructive focus-visible:ring-destructive/30 dark:bg-destructive/70",
        outline:
          "border-border/60 text-foreground/80 [a&]:hover:bg-accent/70 [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
