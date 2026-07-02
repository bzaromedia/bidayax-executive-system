export const fontFamilies = {
  display: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
  heading: ["Inter Tight", "Aptos Display", "Inter", "system-ui", "sans-serif"],
  body: ["Inter", "Aptos", "system-ui", "sans-serif"],
  mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
} as const;

export const fontPairingRecommendations = {
  primary:
    "Use a restrained editorial display face for executive moments, paired with Inter or Aptos for product readability.",
  fallback:
    "Do not load external fonts until approved; use system fallbacks during the foundation phase.",
  data:
    "Use a mono role only for metrics, IDs, timestamps, and dense operational data."
} as const;

export const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem"
} as const;

export const lineHeights = {
  tight: "1.1",
  snug: "1.25",
  normal: "1.5",
  relaxed: "1.65"
} as const;

export const letterSpacing = {
  normal: "0",
  wide: "0.04em",
  wider: "0.08em"
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700"
} as const;

export const typographyTokens = {
  families: fontFamilies,
  recommendations: fontPairingRecommendations,
  sizes: fontSizes,
  lineHeights,
  letterSpacing,
  weights: fontWeights
} as const;

export type TypographyTokens = typeof typographyTokens;
