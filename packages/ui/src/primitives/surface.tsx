import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const surfaceVariants = cva("text-content-primary", {
  variants: {
    tone: {
      canvas: "bg-surface-canvas",
      base: "bg-surface-base",
      raised: "bg-surface-raised shadow-raised",
      panel: "border border-border-subtle bg-surface-panel shadow-hairline",
      inset: "bg-surface-inset"
    },
    radius: {
      none: "rounded-none",
      md: "rounded-bxMd",
      lg: "rounded-bxLg",
      xl: "rounded-bxXl"
    }
  },
  defaultVariants: {
    tone: "base",
    radius: "lg"
  }
});

export type SurfaceProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceVariants>;

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, radius, tone, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ className, radius, tone }))}
      {...props}
    />
  )
);

Surface.displayName = "Surface";
