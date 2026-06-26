import * as React from "react";
import { cn } from "../utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex min-h-10 w-full rounded-bxMd border border-border-muted bg-surface-inset px-3 py-2 font-body text-sm text-content-primary transition-colors placeholder:text-content-muted focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
