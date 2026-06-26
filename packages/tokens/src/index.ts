export * from "./breakpoints";
export * from "./colors";
export * from "./css-vars";
export * from "./elevation";
export * from "./motion";
export * from "./radius";
export * from "./spacing";
export * from "./typography";
export * from "./z-index";

import { breakpointTokens } from "./breakpoints";
import { colorTokens } from "./colors";
import { cssVariableTokens } from "./css-vars";
import { elevationTokens } from "./elevation";
import { motionTokens } from "./motion";
import { radiusTokens } from "./radius";
import { spacingTokens } from "./spacing";
import { typographyTokens } from "./typography";
import { zIndexTokens } from "./z-index";

export const bidayaxTokens = {
  color: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  elevation: elevationTokens,
  motion: motionTokens,
  zIndex: zIndexTokens,
  breakpoints: breakpointTokens,
  cssVariables: cssVariableTokens
} as const;

export type BidayaXTokens = typeof bidayaxTokens;
