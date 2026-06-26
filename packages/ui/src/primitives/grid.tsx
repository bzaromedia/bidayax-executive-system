import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    },
    gap: {
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8"
    }
  },
  defaultVariants: {
    columns: 2,
    gap: 4
  }
});

export type GridProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof gridVariants>;

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, columns, gap, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(gridVariants({ className, columns, gap }))}
      {...props}
    />
  )
);

Grid.displayName = "Grid";
