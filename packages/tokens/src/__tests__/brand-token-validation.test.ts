import { describe, expect, it } from "vitest";
import { validateTenantBrandProfile } from "../brand-token-validation";
import { contrastRatio, normalizeColorToHex } from "../color-utils";

const validProfile = {
  tenantId: "tenant_001",
  companyName: "BidayaX LLC",
  logoAssetId: "asset_logo",
  faviconAssetId: "asset_favicon",
  primaryColor: "#D4AF37",
  secondaryColor: "rgb(26, 26, 26)",
  accentColor: "hsl(45, 65%, 52%)",
  backgroundColor: "#111111",
  textColor: "#F5F5F5",
  fontFamily: "Inter",
  buttonRadius: "0.5rem",
  cardRadius: "0.75rem",
  motionIntensity: "standard",
  contrastMode: "standard",
  createdAt: "2026-07-07T00:00:00.000Z",
  updatedAt: "2026-07-07T00:00:00.000Z"
};

describe("brand token validation", () => {
  it("normalizes HEX, RGB, and HSL colors into canonical HEX", () => {
    expect(normalizeColorToHex("#fff")).toBe("#FFFFFF");
    expect(normalizeColorToHex("rgb(17, 17, 17)")).toBe("#111111");
    expect(normalizeColorToHex("hsl(0, 0%, 100%)")).toBe("#FFFFFF");
  });

  it("validates complete brand profiles", () => {
    const result = validateTenantBrandProfile(validProfile);

    expect(result.valid).toBe(true);
    expect(result.normalizedColors.secondaryColor).toBe("#1A1A1A");
    expect(result.issues).toEqual([]);
  });

  it("reports invalid colors without throwing", () => {
    const result = validateTenantBrandProfile({
      ...validProfile,
      primaryColor: "not-a-color"
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid_color", field: "primaryColor" })
      ])
    );
  });

  it("reports unsafe contrast as a warning", () => {
    const result = validateTenantBrandProfile({
      ...validProfile,
      backgroundColor: "#FFFFFF",
      textColor: "#F5F5F5"
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unsafe_text_background_contrast" })
      ])
    );
  });

  it("calculates WCAG contrast ratios", () => {
    expect(contrastRatio("#FFFFFF", "#111111")).toBeGreaterThan(15);
  });
});

