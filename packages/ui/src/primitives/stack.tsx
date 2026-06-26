import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8"
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch"
    }
  },
  defaultVariants: {
    gap: 4,
    align: "stretch"
  }
});

export type StackProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stackVariants>;

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ align, className, gap, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(stackVariants({ align, className, gap }))}
      {...props}
    />
  )
);

Stack.displayName = "Stack";
