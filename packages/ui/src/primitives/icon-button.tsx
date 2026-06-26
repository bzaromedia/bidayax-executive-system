import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

export const iconButtonVariants = cva(
  "inline-flex size-10 shrink-0 items-center justify-center rounded-bxMd transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-action-primary text-content-inverse hover:bg-action-primaryHover",
        secondary:
          "border border-border-muted bg-action-secondary text-content-primary hover:bg-action-secondaryHover",
        ghost:
          "bg-transparent text-content-secondary hover:bg-action-ghostHover hover:text-content-primary"
      },
      size: {
        sm: "size-9",
        md: "size-10",
        lg: "size-11"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "md"
    }
  }
);

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    readonly asChild?: boolean;
  };

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(iconButtonVariants({ className, size, variant }))}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";
