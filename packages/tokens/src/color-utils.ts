export type RGBColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

const hexColorPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbColorPattern =
  /^rgba?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i;
const hslColorPattern =
  /^hsla?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)%\s*,\s*([+-]?\d+(?:\.\d+)?)%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toHexChannel(value: number): string {
  return clampChannel(value).toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex({ r, g, b }: RGBColor): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function expandHex(hex: string): string {
  if (hex.length !== 3) {
    return hex.toUpperCase();
  }

  const [r, g, b] = hex;
  if (!r || !g || !b) {
    return hex.toUpperCase();
  }

  return `${r}${r}${g}${g}${b}${b}`.toUpperCase();
}

function hslToRgb(hue: number, saturation: number, lightness: number): RGBColor {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = clampUnit(saturation / 100);
  const l = clampUnit(lightness / 100);

  if (s === 0) {
    const value = clampChannel(l * 255);
    return { r: value, g: value, b: value };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToRgb = (tValue: number): number => {
    let t = tValue;
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };

  return {
    r: clampChannel(hueToRgb(h + 1 / 3) * 255),
    g: clampChannel(hueToRgb(h) * 255),
    b: clampChannel(hueToRgb(h - 1 / 3) * 255)
  };
}

export function normalizeColorToHex(input: string): string | null {
  const trimmed = input.trim();
  const hexMatch = trimmed.match(hexColorPattern);
  if (hexMatch?.[1]) {
    return `#${expandHex(hexMatch[1])}`;
  }

  const rgbMatch = trimmed.match(rgbColorPattern);
  if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
    return rgbToHex({
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3])
    });
  }

  const hslMatch = trimmed.match(hslColorPattern);
  if (hslMatch?.[1] && hslMatch[2] && hslMatch[3]) {
    return rgbToHex(
      hslToRgb(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]))
    );
  }

  return null;
}

export function hexToRgb(hex: string): RGBColor | null {
  const normalized = normalizeColorToHex(hex);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }

  return (
    0.2126 * channelToLinear(rgb.r) +
    0.7152 * channelToLinear(rgb.g) +
    0.0722 * channelToLinear(rgb.b)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 0;
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function chooseAccessibleTextColor(
  background: string,
  preferredText = "#F5F5F5"
): string {
  const preferredContrast = contrastRatio(preferredText, background);
  const whiteContrast = contrastRatio("#FFFFFF", background);
  const blackContrast = contrastRatio("#111111", background);

  if (preferredContrast >= whiteContrast && preferredContrast >= blackContrast) {
    return normalizeColorToHex(preferredText) ?? "#F5F5F5";
  }

  return whiteContrast >= blackContrast ? "#FFFFFF" : "#111111";
}
