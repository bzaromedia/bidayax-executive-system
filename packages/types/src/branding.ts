export const brandMotionIntensities = ["none", "reduced", "standard", "expressive"] as const;
export const brandContrastModes = ["standard", "high_contrast", "soft_luxury"] as const;

export type BrandMotionIntensity = (typeof brandMotionIntensities)[number];
export type BrandContrastMode = (typeof brandContrastModes)[number];

export type TenantBrandProfile = {
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
  readonly motionIntensity: BrandMotionIntensity;
  readonly contrastMode: BrandContrastMode;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BrandAsset = {
  readonly assetId: string;
  readonly tenantId: string;
  readonly assetType: "logo" | "favicon" | "profile_image" | "card_media";
  readonly storagePath: string;
  readonly altText: string;
  readonly mimeType: string;
  readonly checksumSha256: string;
  readonly createdAt: string;
};

export type ResolvedBrandTokenSnapshot = {
  readonly tenantId: string;
  readonly sourceBrandProfileId: string;
  readonly primaryToken: string;
  readonly secondaryToken: string;
  readonly accentToken: string;
  readonly backgroundToken: string;
  readonly textToken: string;
  readonly fontFamilyToken: string;
  readonly buttonRadiusToken: string;
  readonly cardRadiusToken: string;
  readonly contrastWarnings: readonly string[];
  readonly fallbackApplied: boolean;
  readonly resolvedAt: string;
};

export type BrandTokenResolutionInput = {
  readonly brandProfile: TenantBrandProfile;
  readonly fallbackProfile: TenantBrandProfile;
  readonly minimumContrastRatio: number;
};

export type BrandTokenResolutionResult = {
  readonly approved: boolean;
  readonly snapshot: ResolvedBrandTokenSnapshot;
  readonly rejectionReasons: readonly string[];
};
