import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Colour is state, and nothing else. Adding a decorative variant here is how a
 * board stops meaning anything at a glance.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border text-muted-foreground bg-muted/60",
        overdue: "border-danger/30 text-danger bg-danger/10",
        stuck: "border-warning/30 text-warning bg-warning/10",
        done: "border-success/30 text-success bg-success/10",
        active: "border-active/30 text-active bg-active/10",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
