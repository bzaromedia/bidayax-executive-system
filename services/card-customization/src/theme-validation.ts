import type { BrandThemeConfig } from "@bidayax/types";

export type ParsedThemeColor =
  | {
      readonly kind: "rgb";
      readonly red: number;
      readonly green: number;
      readonly blue: number;
    }
  | {
      readonly kind: "token";
      readonly value: string;
    };

export type ThemeValidationIssue = {
  readonly field: keyof BrandThemeConfig;
  readonly message: string;
};

export type ThemeValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly ThemeValidationIssue[];
};

const colorFields = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundColor",
  "surfaceColor",
  "textColor",
  "mutedTextColor"
] as const satisfies readonly (keyof BrandThemeConfig)[];

const cssVariablePattern = /^var\(--[a-z0-9-]+\)$/i;

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, value));
}

function parseRgbParts(parts: readonly string[]) {
  if (parts.length < 3) {
    return null;
  }

  const values = parts.slice(0, 3).map((part) => Number.parseInt(part, 10));

  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 255)) {
    return null;
  }

  return {
    blue: clampChannel(values[2] ?? 0),
    green: clampChannel(values[1] ?? 0),
    kind: "rgb" as const,
    red: clampChannel(values[0] ?? 0)
  };
}

function parseHexColor(value: string): ParsedThemeColor | null {
  if (!value.startsWith("#")) {
    return null;
  }

  const hex = value.slice(1);
  const isValidLength = hex.length === 3 || hex.length === 6 || hex.length === 8;
  const isValidHex = /^[0-9a-f]+$/i.test(hex);

  if (!isValidLength || !isValidHex) {
    return null;
  }

  const normalized = hex.length === 3
    ? hex
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : hex.slice(0, 6);

  return {
    blue: Number.parseInt(normalized.slice(4, 6), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    kind: "rgb",
    red: Number.parseInt(normalized.slice(0, 2), 16)
  };
}

export function parseThemeColor(value: string): ParsedThemeColor | null {
  const trimmed = value.trim();

  if (cssVariablePattern.test(trimmed)) {
    return {
      kind: "token",
      value: trimmed
    };
  }

  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }

  if (trimmed.toLowerCase().startsWith("rgb(")) {
    const inner = trimmed.slice(trimmed.indexOf("(") + 1, trimmed.lastIndexOf(")"));
    const parts = inner.replace(/,/g, " ").split(/\s+/).filter(Boolean);

    return parseRgbParts(parts);
  }

  return null;
}

export function isSupportedThemeColor(value: string) {
  return parseThemeColor(value) !== null;
}

function linearize(channel: number) {
  const normalized = channel / 255;

  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Extract<ParsedThemeColor, { readonly kind: "rgb" }>) {
  return (
    linearize(color.red) * 0.2126 +
    linearize(color.green) * 0.7152 +
    linearize(color.blue) * 0.0722
  );
}

export function getContrastRatio(
  foreground: ParsedThemeColor,
  background: ParsedThemeColor
) {
  if (foreground.kind !== "rgb" || background.kind !== "rgb") {
    return null;
  }

  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function validateBrandThemeConfig(
  config: BrandThemeConfig
): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];
  const parsedColors = new Map<keyof BrandThemeConfig, ParsedThemeColor>();

  for (const field of colorFields) {
    const parsed = parseThemeColor(config[field]);

    if (!parsed) {
      issues.push({
        field,
        message: `${String(field)} must use an approved token, rgb value, or valid hex value.`
      });
      continue;
    }

    parsedColors.set(field, parsed);
  }

  const text = parsedColors.get("textColor");
  const background = parsedColors.get("backgroundColor");

  if (text && background) {
    const contrastRatio = getContrastRatio(text, background);

    if (contrastRatio !== null && contrastRatio < 4.5) {
      issues.push({
        field: "textColor",
        message: "Text and background colors must meet readable contrast."
      });
    }
  }

  return {
    issues,
    valid: issues.length === 0
  };
}
