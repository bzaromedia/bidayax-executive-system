import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      sm: "py-8",
      md: "py-12",
      lg: "py-16"
    },
    tone: {
      canvas: "bg-surface-canvas",
      base: "bg-surface-base",
      raised: "bg-surface-raised"
    }
  },
  defaultVariants: {
    spacing: "md",
    tone: "base"
  }
});

export type SectionProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof sectionVariants>;

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, tone, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(sectionVariants({ className, spacing, tone }))}
      {...props}
    />
  )
);

Section.displayName = "Section";
