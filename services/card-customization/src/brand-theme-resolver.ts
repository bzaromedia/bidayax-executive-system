import type { BrandThemeConfig } from "@bidayax/types";
import { validateBrandThemeConfig } from "./theme-validation";

export const defaultExecutiveBrandTheme = {
  accentColor: "var(--bx-color-content-accent)",
  approved: true,
  backgroundColor: "var(--bx-color-surface-canvas)",
  brandName: "The Executive Card",
  fontBody: "Inter",
  fontDisplay: "Playfair Display",
  logoMarkUrl: "/brand/Logo-Mark.png",
  logoUrl: "/brand/TEC-Logo.png",
  mutedTextColor: "var(--bx-color-content-muted)",
  ownerId: "bidayax-llc",
  primaryColor: "var(--bx-color-action-primary)",
  secondaryColor: "var(--bx-color-surface-inverse)",
  surfaceColor: "var(--bx-color-surface-raised)",
  textColor: "var(--bx-color-content-primary)",
  themeId: "executive-black-gold"
} as const satisfies BrandThemeConfig;

export type BrandThemeResolution = {
  readonly theme: BrandThemeConfig;
  readonly usedFallback: boolean;
  readonly validation: ReturnType<typeof validateBrandThemeConfig>;
};

export function resolveBrandThemeConfig(
  config: BrandThemeConfig | null | undefined
): BrandThemeResolution {
  if (!config || !config.approved) {
    return {
      theme: defaultExecutiveBrandTheme,
      usedFallback: true,
      validation: validateBrandThemeConfig(defaultExecutiveBrandTheme)
    };
  }

  const validation = validateBrandThemeConfig(config);

  if (!validation.valid) {
    return {
      theme: defaultExecutiveBrandTheme,
      usedFallback: true,
      validation
    };
  }

  return {
    theme: config,
    usedFallback: false,
    validation
  };
}
