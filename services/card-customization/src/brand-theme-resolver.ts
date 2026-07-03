import { primitiveColors } from "@bidayax/tokens";
import type { BrandThemeConfig } from "@bidayax/types";
import { validateBrandThemeConfig } from "./theme-validation";

export const defaultExecutiveBrandTheme = {
  accentColor: primitiveColors.gold.brand,
  approved: true,
  backgroundColor: primitiveColors.black[850],
  brandName: "The Executive Card",
  fontBody: "Inter",
  fontDisplay: "Playfair Display",
  logoMarkUrl: "/brand/Logo-Mark.png",
  logoUrl: "/brand/TEC-Logo.png",
  mutedTextColor: primitiveColors.neutral.mutedGray,
  ownerId: "bidayax-llc",
  primaryColor: primitiveColors.gold.brand,
  secondaryColor: primitiveColors.black.brand,
  surfaceColor: primitiveColors.charcoal.brand,
  textColor: primitiveColors.neutral.pureWhite,
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
