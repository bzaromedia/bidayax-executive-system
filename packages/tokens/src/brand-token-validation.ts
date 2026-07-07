import { contrastRatio, normalizeColorToHex } from "./color-utils";

export type TenantBrandProfileInput = {
  readonly tenantId: string;
  readonly companyName: string;
  readonly logoAssetId: string;
  readonly faviconAssetId: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly fontFamily: string;
  readonly buttonRadius: string;
  readonly cardRadius: string;
  readonly motionIntensity: string;
  readonly contrastMode: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BrandTokenValidationIssue = {
  readonly code: string;
  readonly field: string;
  readonly message: string;
  readonly severity: "warning" | "error";
};

export type NormalizedBrandColors = {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
};

export type BrandTokenValidationResult = {
  readonly valid: boolean;
  readonly normalizedColors: NormalizedBrandColors;
  readonly issues: readonly BrandTokenValidationIssue[];
};

const requiredTextFields = [
  "tenantId",
  "companyName",
  "logoAssetId",
  "faviconAssetId",
  "fontFamily",
  "buttonRadius",
  "cardRadius",
  "motionIntensity",
  "contrastMode"
] as const satisfies readonly (keyof TenantBrandProfileInput)[];

const colorFields = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundColor",
  "textColor"
] as const satisfies readonly (keyof TenantBrandProfileInput)[];

export const defaultBrandColors: NormalizedBrandColors = {
  primaryColor: "#D4AF37",
  secondaryColor: "#1A1A1A",
  accentColor: "#D4AF37",
  backgroundColor: "#111111",
  textColor: "#F5F5F5"
} as const;

function readProfileString(
  profile: TenantBrandProfileInput,
  field: keyof TenantBrandProfileInput
): string {
  const value = profile[field];
  return typeof value === "string" ? value.trim() : "";
}

function validateRequiredText(
  profile: TenantBrandProfileInput,
  issues: BrandTokenValidationIssue[]
): void {
  for (const field of requiredTextFields) {
    if (readProfileString(profile, field).length === 0) {
      issues.push({
        code: "required_value_missing",
        field,
        message: `${field} is required for brand token resolution.`,
        severity: "error"
      });
    }
  }
}

function normalizeBrandColors(
  profile: TenantBrandProfileInput,
  issues: BrandTokenValidationIssue[]
): NormalizedBrandColors {
  const normalizedEntries = colorFields.map((field) => {
    const normalized = normalizeColorToHex(readProfileString(profile, field));
    if (!normalized) {
      issues.push({
        code: "invalid_color",
        field,
        message: `${field} must be a valid HEX, RGB, or HSL color.`,
        severity: "error"
      });
    }

    return [field, normalized ?? defaultBrandColors[field]] as const;
  });

  return Object.fromEntries(normalizedEntries) as NormalizedBrandColors;
}

export function validateBrandContrast(
  colors: NormalizedBrandColors,
  minimumContrastRatio = 4.5
): readonly BrandTokenValidationIssue[] {
  const issues: BrandTokenValidationIssue[] = [];
  const textContrast = contrastRatio(colors.textColor, colors.backgroundColor);
  const buttonContrast = contrastRatio("#111111", colors.accentColor);

  if (textContrast < minimumContrastRatio) {
    issues.push({
      code: "unsafe_text_background_contrast",
      field: "textColor",
      message: `Text/background contrast is ${textContrast}; minimum is ${minimumContrastRatio}.`,
      severity: "warning"
    });
  }

  if (buttonContrast < minimumContrastRatio) {
    issues.push({
      code: "unsafe_action_contrast",
      field: "accentColor",
      message: `Action/text contrast is ${buttonContrast}; minimum is ${minimumContrastRatio}.`,
      severity: "warning"
    });
  }

  return issues;
}

export function validateTenantBrandProfile(
  profile: TenantBrandProfileInput,
  minimumContrastRatio = 4.5
): BrandTokenValidationResult {
  const issues: BrandTokenValidationIssue[] = [];
  validateRequiredText(profile, issues);
  const normalizedColors = normalizeBrandColors(profile, issues);
  issues.push(...validateBrandContrast(normalizedColors, minimumContrastRatio));

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    normalizedColors,
    issues
  };
}
