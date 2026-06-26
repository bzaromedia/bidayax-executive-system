import * as React from "react";
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";

export type VisuallyHiddenProps = React.ComponentPropsWithoutRef<
  typeof VisuallyHiddenPrimitive.Root
>;

export const VisuallyHidden = VisuallyHiddenPrimitive.Root;
