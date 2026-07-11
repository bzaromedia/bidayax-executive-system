import { describe, expect, it } from "vitest";
import type { BrandAsset } from "@bidayax/types";
import { createAssetReferenceKey, validateBrandAssetReference } from "../settings-asset-management";

const asset: BrandAsset = {
  altText: "Company logo",
  assetId: "asset-1",
  assetType: "logo",
  checksumSha256: "a".repeat(64),
  createdAt: "2026-07-10T00:00:00.000Z",
  mimeType: "image/png",
  storagePath: "/uploads/logos/asset-1.png",
  tenantId: "tenant-a"
};

describe("settings asset management", () => {
  it("accepts tenant-owned managed image references", () => {
    expect(validateBrandAssetReference(asset, "tenant-a").valid).toBe(true);
  });

  it("rejects cross-tenant asset references", () => {
    const result = validateBrandAssetReference(asset, "tenant-b");
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toContain("tenant");
  });

  it("creates tenant-scoped asset keys", () => {
    expect(createAssetReferenceKey({ assetId: "asset-1", tenantId: "tenant-a" })).toBe("tenant-a:asset:asset-1");
  });
});
