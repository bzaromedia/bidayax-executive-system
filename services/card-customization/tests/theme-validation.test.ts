import { describe, expect, it } from "vitest";
import { defaultExecutiveBrandTheme } from "../src/brand-theme-resolver";
import { validateBrandThemeConfig } from "../src/theme-validation";

describe("theme validation", () => {
  it("rejects invalid color values", () => {
    const result = validateBrandThemeConfig({
      ...defaultExecutiveBrandTheme,
      primaryColor: "brand-gold"
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "primaryColor")).toBe(true);
  });

  it("accepts design token aliases", () => {
    const result = validateBrandThemeConfig(defaultExecutiveBrandTheme);

    expect(result.valid).toBe(true);
  });
});
