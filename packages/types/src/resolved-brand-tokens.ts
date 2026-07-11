export type ResolvedBrandTokenColors = {
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

export type ResolvedBrandTokenTypography = {
  readonly fontFamily: string;
  readonly displayFont: string;
  readonly bodyFont: string;
};

export type ResolvedBrandTokenRadius = {
  readonly buttonRadius: string;
  readonly cardRadius: string;
};

export type ResolvedBrandTokenMotion = {
  readonly intensity: "none" | "reduced" | "standard" | "expressive";
  readonly durationToken: string;
};

export type ResolvedBrandTokenAccessibility = {
  readonly contrastMode: "standard" | "high_contrast" | "soft_luxury";
  readonly textOnBackgroundContrast: number;
  readonly actionContrast: number;
  readonly minimumContrastRatio: number;
  readonly fallbackApplied: boolean;
  readonly wcagLevel: "AA" | "below-aa";
};

export type ResolvedBrandTokens = {
  readonly tenantId: string;
  readonly sourceBrandProfileId: string;
  readonly colors: ResolvedBrandTokenColors;
  readonly typography: ResolvedBrandTokenTypography;
  readonly radius: ResolvedBrandTokenRadius;
  readonly motion: ResolvedBrandTokenMotion;
  readonly accessibility: ResolvedBrandTokenAccessibility;
  readonly warnings: readonly string[];
  readonly resolverVersion: string;
  readonly snapshotHash: string;
  readonly createdAt: string;
};
