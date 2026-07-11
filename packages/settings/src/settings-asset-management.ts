import type { BrandAsset } from "@bidayax/types";

export type AssetReferenceValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly string[];
};

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp"
]);

export function validateBrandAssetReference(
  asset: BrandAsset,
  tenantId: string
): AssetReferenceValidationResult {
  const issues: string[] = [];

  if (asset.tenantId !== tenantId) {
    issues.push("Asset tenant does not match the settings tenant.");
  }

  if (!allowedMimeTypes.has(asset.mimeType)) {
    issues.push("Asset MIME type is not allowed for card branding.");
  }

  if (!asset.storagePath.startsWith("/uploads/") && !asset.storagePath.startsWith("https://")) {
    issues.push("Asset storage path must be a managed upload path or future CDN URL.");
  }

  if (asset.checksumSha256.length < 32) {
    issues.push("Asset checksum reference is required.");
  }

  if (!asset.altText.trim()) {
    issues.push("Asset alt text is required for accessible previews.");
  }

  return {
    issues,
    valid: issues.length === 0
  };
}

export function createAssetReferenceKey(input: {
  readonly assetId: string;
  readonly tenantId: string;
}): string {
  return `${input.tenantId}:asset:${input.assetId}`;
}
