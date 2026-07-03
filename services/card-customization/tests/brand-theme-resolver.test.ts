import { describe, expect, it } from "vitest";
import type { BrandThemeConfig } from "@bidayax/types";
import {
  defaultExecutiveBrandTheme,
  resolveBrandThemeConfig
} from "../src/brand-theme-resolver";
import { validateBrandThemeConfig } from "../src/theme-validation";

function validTheme(overrides: Partial<BrandThemeConfig> = {}): BrandThemeConfig {
  return {
    ...defaultExecutiveBrandTheme,
    accentColor: "rgb(212 175 55)",
    backgroundColor: "rgb(10 10 10)",
    mutedTextColor: "rgb(180 180 180)",
    primaryColor: "rgb(212 175 55)",
    secondaryColor: "rgb(20 20 20)",
    surfaceColor: "rgb(26 26 26)",
    textColor: "rgb(245 245 245)",
    themeId: "customer-theme",
    ...overrides
  };
}

describe("brand theme resolver", () => {
  it("applies a valid approved theme", () => {
    const theme = validTheme();
    const resolution = resolveBrandThemeConfig(theme);

    expect(resolution.usedFallback).toBe(false);
    expect(resolution.theme.themeId).toBe("customer-theme");
  });

  it("rejects invalid contrast", () => {
    const result = validateBrandThemeConfig(
      validTheme({
        backgroundColor: "rgb(20 20 20)",
        textColor: "rgb(21 21 21)"
      })
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "textColor")).toBe(true);
  });

  it("falls back when a theme is not approved", () => {
    const resolution = resolveBrandThemeConfig(validTheme({ approved: false }));

    expect(resolution.usedFallback).toBe(true);
    expect(resolution.theme.themeId).toBe(defaultExecutiveBrandTheme.themeId);
  });
});
