import { colorTokens } from "./colors";
import {
  chooseAccessibleTextColor,
  contrastRatio,
  normalizeColorToHex
} from "./color-utils";
import { durationTokens } from "./motion";
import { radiusTokens } from "./radius";
import { fontFamilies } from "./typography";
import {
  defaultBrandColors,
  type NormalizedBrandColors,
  type TenantBrandProfileInput,
  validateTenantBrandProfile
} from "./brand-token-validation";

export const brandTokenResolverVersion = "2.0.0-phase-2b";

export type BrandMotionIntensity = "none" | "reduced" | "standard" | "expressive";
export type BrandContrastMode = "standard" | "high_contrast" | "soft_luxury";

export type ResolvedBrandTokens = {
  readonly tenantId: string;
  readonly sourceBrandProfileId: string;
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly surface: string;
    readonly text: string;
    readonly mutedText: string;
    readonly actionPrimary: string;
    readonly actionText: string;
    readonly focus: string;
  };
  readonly typography: {
    readonly fontFamily: string;
    readonly displayFont: string;
    readonly bodyFont: string;
  };
  readonly radius: {
    readonly buttonRadius: string;
    readonly cardRadius: string;
  };
  readonly motion: {
    readonly intensity: BrandMotionIntensity;
    readonly durationToken: string;
  };
  readonly accessibility: {
    readonly contrastMode: BrandContrastMode;
    readonly textOnBackgroundContrast: number;
    readonly actionContrast: number;
    readonly minimumContrastRatio: number;
    readonly fallbackApplied: boolean;
    readonly wcagLevel: "AA" | "below-aa";
  };
  readonly warnings: readonly string[];
  readonly resolverVersion: string;
  readonly snapshotHash: string;
  readonly createdAt: string;
};

export type BrandTokenResolverOptions = {
  readonly createdAt?: string;
  readonly minimumContrastRatio?: number;
};

type SourceBrandProfile = TenantBrandProfileInput & {
  readonly brandProfileId?: string;
  readonly sourceBrandProfileId?: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right)
  );

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

function createDeterministicHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function sourceBrandProfileId(profile: SourceBrandProfile): string {
  return (
    profile.sourceBrandProfileId ??
    profile.brandProfileId ??
    `${profile.tenantId}:tenant-brand-profile`
  );
}

function resolveRadius(value: string, fallback: keyof typeof radiusTokens): string {
  const normalized = value.trim();
  const approvedRadius = Object.values(radiusTokens).find(
    (token) => token === normalized
  );

  return approvedRadius ?? radiusTokens[fallback];
}

function resolveMotionIntensity(value: string): BrandMotionIntensity {
  if (
    value === "none" ||
    value === "reduced" ||
    value === "standard" ||
    value === "expressive"
  ) {
    return value;
  }

  return "standard";
}

function resolveContrastMode(value: string): BrandContrastMode {
  if (
    value === "standard" ||
    value === "high_contrast" ||
    value === "soft_luxury"
  ) {
    return value;
  }

  return "standard";
}

function resolveDurationToken(intensity: BrandMotionIntensity): string {
  if (intensity === "none") {
    return durationTokens.instant;
  }

  if (intensity === "reduced") {
    return durationTokens.fast;
  }

  if (intensity === "expressive") {
    return durationTokens.slow;
  }

  return durationTokens.normal;
}

function applyContrastFallbacks(
  colors: NormalizedBrandColors,
  minimumContrastRatio: number,
  warnings: string[]
): {
  readonly colors: NormalizedBrandColors;
  readonly fallbackApplied: boolean;
} {
  let fallbackApplied = false;
  let backgroundColor = colors.backgroundColor;
  let textColor = colors.textColor;
  let accentColor = colors.accentColor;

  if (contrastRatio(textColor, backgroundColor) < minimumContrastRatio) {
    backgroundColor = defaultBrandColors.backgroundColor;
    textColor = defaultBrandColors.textColor;
    fallbackApplied = true;
    warnings.push(
      "Text/background contrast was unsafe; default Executive Card background and text tokens were applied."
    );
  }

  if (contrastRatio("#111111", accentColor) < minimumContrastRatio) {
    accentColor = colorTokens.primitive.gold.brand;
    fallbackApplied = true;
    warnings.push(
      "Action contrast was unsafe; default Executive Card gold action token was applied."
    );
  }

  return {
    colors: {
      ...colors,
      accentColor,
      backgroundColor,
      textColor
    },
    fallbackApplied
  };
}

function mapToResolvedTokens(
  profile: TenantBrandProfileInput,
  colors: NormalizedBrandColors,
  fallbackApplied: boolean,
  minimumContrastRatio: number,
  warnings: readonly string[],
  createdAt: string
): Omit<ResolvedBrandTokens, "snapshotHash"> {
  const actionText = chooseAccessibleTextColor(colors.accentColor, "#111111");
  const textOnBackgroundContrast = contrastRatio(
    colors.textColor,
    colors.backgroundColor
  );
  const actionContrast = contrastRatio(actionText, colors.accentColor);
  const motionIntensity = resolveMotionIntensity(profile.motionIntensity);

  return {
    tenantId: profile.tenantId,
    sourceBrandProfileId: sourceBrandProfileId(profile),
    colors: {
      primary: colors.primaryColor,
      secondary: colors.secondaryColor,
      accent: colors.accentColor,
      background: colors.backgroundColor,
      surface:
        normalizeColorToHex(profile.secondaryColor) ??
        colorTokens.semantic.surface.raised,
      text: colors.textColor,
      mutedText: colorTokens.semantic.content.muted,
      actionPrimary: colors.accentColor,
      actionText,
      focus: colors.accentColor
    },
    typography: {
      fontFamily: profile.fontFamily.trim(),
      displayFont: fontFamilies.display.join(", "),
      bodyFont: fontFamilies.body.join(", ")
    },
    radius: {
      buttonRadius: resolveRadius(profile.buttonRadius, "lg"),
      cardRadius: resolveRadius(profile.cardRadius, "xl")
    },
    motion: {
      intensity: motionIntensity,
      durationToken: resolveDurationToken(motionIntensity)
    },
    accessibility: {
      contrastMode: resolveContrastMode(profile.contrastMode),
      textOnBackgroundContrast,
      actionContrast,
      minimumContrastRatio,
      fallbackApplied,
      wcagLevel:
        textOnBackgroundContrast >= minimumContrastRatio &&
        actionContrast >= minimumContrastRatio
          ? "AA"
          : "below-aa"
    },
    warnings,
    resolverVersion: brandTokenResolverVersion,
    createdAt
  };
}

export function resolveBrandTokens(
  profile: TenantBrandProfileInput,
  options: BrandTokenResolverOptions = {}
): ResolvedBrandTokens {
  const minimumContrastRatio = options.minimumContrastRatio ?? 4.5;
  const createdAt = options.createdAt ?? new Date().toISOString();
  const validation = validateTenantBrandProfile(profile, minimumContrastRatio);
  const warnings = validation.issues.map(
    (issue) => `${issue.code}:${issue.field}:${issue.message}`
  );

  const fallbackResult = applyContrastFallbacks(
    validation.normalizedColors,
    minimumContrastRatio,
    warnings
  );

  const resolvedWithoutHash = mapToResolvedTokens(
    profile,
    fallbackResult.colors,
    fallbackResult.fallbackApplied,
    minimumContrastRatio,
    warnings,
    createdAt
  );
  const snapshotHash = createDeterministicHash({
    ...resolvedWithoutHash,
    createdAt: undefined,
    snapshotHash: undefined
  });

  return {
    ...resolvedWithoutHash,
    snapshotHash
  };
}
