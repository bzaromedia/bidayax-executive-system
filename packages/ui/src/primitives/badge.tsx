import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-bxSm border px-2 py-0.5 font-heading text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "border-border-muted bg-surface-panel text-content-secondary",
        accent: "border-border-strong bg-action-ghostHover text-content-accent",
        inverse: "border-transparent bg-surface-inverse text-content-inverse"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ className, variant }))}
      {...props}
    />
  )
);

Badge.displayName = "Badge";
