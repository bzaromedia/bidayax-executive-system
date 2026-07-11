import { describe, expect, it } from "vitest";
import {
  brandTokenResolverVersion,
  resolveBrandTokens
} from "../brand-token-resolver";

const profile = {
  tenantId: "tenant_001",
  companyName: "BidayaX LLC",
  logoAssetId: "asset_logo",
  faviconAssetId: "asset_favicon",
  primaryColor: "#D4AF37",
  secondaryColor: "#1A1A1A",
  accentColor: "#D4AF37",
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

const createdAt = "2026-07-07T12:00:00.000Z";

describe("brand token resolver", () => {
  it("maps tenant colors into approved Executive Card token slots", () => {
    const resolved = resolveBrandTokens(profile, { createdAt });

    expect(resolved.tenantId).toBe(profile.tenantId);
    expect(resolved.sourceBrandProfileId).toBe(
      `${profile.tenantId}:tenant-brand-profile`
    );
    expect(resolved.colors.primary).toBe("#D4AF37");
    expect(resolved.colors.background).toBe("#111111");
    expect(resolved.colors.actionText).toBe("#111111");
    expect(resolved.typography.displayFont).toContain("Playfair Display");
    expect(resolved.radius.buttonRadius).toBe("0.5rem");
    expect(resolved.motion.durationToken).toBe("180ms");
    expect(resolved.resolverVersion).toBe(brandTokenResolverVersion);
  });

  it("applies safe fallbacks for unreadable text/background contrast", () => {
    const resolved = resolveBrandTokens(
      {
        ...profile,
        backgroundColor: "#FFFFFF",
        textColor: "#F5F5F5"
      },
      { createdAt }
    );

    expect(resolved.colors.background).toBe("#111111");
    expect(resolved.colors.text).toBe("#F5F5F5");
    expect(resolved.accessibility.fallbackApplied).toBe(true);
    expect(resolved.accessibility.wcagLevel).toBe("AA");
    expect(resolved.warnings.join(" ")).toContain("unsafe_text_background_contrast");
  });

  it("normalizes valid customer colors while preserving structure tokens", () => {
    const resolved = resolveBrandTokens(
      {
        ...profile,
        primaryColor: "rgb(212, 175, 55)",
        secondaryColor: "hsl(0, 0%, 10%)",
        accentColor: "#D4AF37"
      },
      { createdAt }
    );

    expect(resolved.colors.primary).toBe("#D4AF37");
    expect(resolved.colors.secondary).toBe("#1A1A1A");
    expect(resolved.radius.cardRadius).toBe("0.75rem");
  });

  it("falls back to approved radius tokens for arbitrary radius input", () => {
    const resolved = resolveBrandTokens(
      {
        ...profile,
        buttonRadius: "18px",
        cardRadius: "42px"
      },
      { createdAt }
    );

    expect(resolved.radius.buttonRadius).toBe("0.5rem");
    expect(resolved.radius.cardRadius).toBe("0.75rem");
  });

  it("creates deterministic snapshot hashes independent of createdAt", () => {
    const first = resolveBrandTokens(profile, {
      createdAt: "2026-07-07T12:00:00.000Z"
    });
    const second = resolveBrandTokens(profile, {
      createdAt: "2026-07-07T13:00:00.000Z"
    });

    expect(first.snapshotHash).toBe(second.snapshotHash);
    expect(first.snapshotHash).toMatch(/^fnv1a-[0-9a-f]{8}$/);
  });
});

