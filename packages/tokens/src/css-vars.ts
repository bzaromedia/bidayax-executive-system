import { semanticColors } from "./colors";
import { elevationTokens } from "./elevation";
import { motionTokens } from "./motion";
import { radiusTokens } from "./radius";
import { spacingTokens } from "./spacing";
import { typographyTokens } from "./typography";
import { zIndexTokens } from "./z-index";

export const cssVariableTokens = {
  "--bx-color-surface-canvas": semanticColors.surface.canvas,
  "--bx-color-surface-base": semanticColors.surface.base,
  "--bx-color-surface-raised": semanticColors.surface.raised,
  "--bx-color-surface-panel": semanticColors.surface.panel,
  "--bx-color-surface-inset": semanticColors.surface.inset,
  "--bx-color-surface-inverse": semanticColors.surface.inverse,
  "--bx-color-content-primary": semanticColors.content.primary,
  "--bx-color-content-secondary": semanticColors.content.secondary,
  "--bx-color-content-muted": semanticColors.content.muted,
  "--bx-color-content-inverse": semanticColors.content.inverse,
  "--bx-color-content-accent": semanticColors.content.accent,
  "--bx-color-border-subtle": semanticColors.border.subtle,
  "--bx-color-border-muted": semanticColors.border.muted,
  "--bx-color-border-strong": semanticColors.border.strong,
  "--bx-color-border-focus": semanticColors.border.focus,
  "--bx-color-action-primary": semanticColors.action.primary,
  "--bx-color-action-primary-hover": semanticColors.action.primaryHover,
  "--bx-color-action-secondary": semanticColors.action.secondary,
  "--bx-color-action-secondary-hover": semanticColors.action.secondaryHover,
  "--bx-color-action-ghost-hover": semanticColors.action.ghostHover,
  "--bx-font-display": typographyTokens.families.display.join(", "),
  "--bx-font-heading": typographyTokens.families.heading.join(", "),
  "--bx-font-body": typographyTokens.families.body.join(", "),
  "--bx-font-mono": typographyTokens.families.mono.join(", "),
  "--bx-radius-sm": radiusTokens.sm,
  "--bx-radius-md": radiusTokens.md,
  "--bx-radius-lg": radiusTokens.lg,
  "--bx-radius-xl": radiusTokens.xl,
  "--bx-shadow-hairline": elevationTokens.hairline,
  "--bx-shadow-raised": elevationTokens.raised,
  "--bx-shadow-floating": elevationTokens.floating,
  "--bx-shadow-focus": elevationTokens.focus,
  "--bx-motion-fast": motionTokens.duration.fast,
  "--bx-motion-normal": motionTokens.duration.normal,
  "--bx-motion-slow": motionTokens.duration.slow,
  "--bx-ease-standard": motionTokens.easing.standard,
  "--bx-space-1": spacingTokens[1],
  "--bx-space-2": spacingTokens[2],
  "--bx-space-3": spacingTokens[3],
  "--bx-space-4": spacingTokens[4],
  "--bx-space-6": spacingTokens[6],
  "--bx-space-8": spacingTokens[8],
  "--bx-z-overlay": String(zIndexTokens.overlay),
  "--bx-z-modal": String(zIndexTokens.modal)
} as const;

export type CssVariableTokens = typeof cssVariableTokens;
