import type { Config } from "tailwindcss";
import {
  breakpointTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
  zIndexTokens
} from "@bidayax/tokens";

const tailwindZIndexTokens = Object.fromEntries(
  Object.entries(zIndexTokens).map(([key, value]) => [key, String(value)])
);

export const bidayaxTailwindPreset = {
  darkMode: "class",
  theme: {
    screens: breakpointTokens,
    extend: {
      colors: {
        surface: {
          canvas: "var(--bx-color-surface-canvas)",
          base: "var(--bx-color-surface-base)",
          raised: "var(--bx-color-surface-raised)",
          panel: "var(--bx-color-surface-panel)",
          inset: "var(--bx-color-surface-inset)",
          inverse: "var(--bx-color-surface-inverse)"
        },
        content: {
          primary: "var(--bx-color-content-primary)",
          secondary: "var(--bx-color-content-secondary)",
          muted: "var(--bx-color-content-muted)",
          inverse: "var(--bx-color-content-inverse)",
          accent: "var(--bx-color-content-accent)"
        },
        border: {
          subtle: "var(--bx-color-border-subtle)",
          muted: "var(--bx-color-border-muted)",
          strong: "var(--bx-color-border-strong)",
          focus: "var(--bx-color-border-focus)"
        },
        action: {
          primary: "var(--bx-color-action-primary)",
          primaryHover: "var(--bx-color-action-primary-hover)",
          secondary: "var(--bx-color-action-secondary)",
          secondaryHover: "var(--bx-color-action-secondary-hover)",
          ghostHover: "var(--bx-color-action-ghost-hover)"
        }
      },
      fontFamily: {
        display: typographyTokens.families.display,
        heading: typographyTokens.families.heading,
        body: typographyTokens.families.body,
        mono: typographyTokens.families.mono
      },
      borderRadius: {
        bxSm: radiusTokens.sm,
        bxMd: radiusTokens.md,
        bxLg: radiusTokens.lg,
        bxXl: radiusTokens.xl
      },
      boxShadow: {
        hairline: "var(--bx-shadow-hairline)",
        raised: "var(--bx-shadow-raised)",
        floating: "var(--bx-shadow-floating)",
        focus: "var(--bx-shadow-focus)"
      },
      spacing: spacingTokens,
      zIndex: tailwindZIndexTokens
    }
  }
} satisfies Config;

export default bidayaxTailwindPreset;
