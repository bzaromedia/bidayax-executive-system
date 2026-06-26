type ColorScale = Record<string, string>;

export const primitiveColors = {
  black: {
    950: "#030405",
    900: "#07090B",
    850: "#0B0E11"
  },
  charcoal: {
    900: "#111418",
    800: "#181D22",
    700: "#222931",
    600: "#2F3842"
  },
  gunmetal: {
    900: "#151A1F",
    800: "#1E252C",
    700: "#2A333D",
    600: "#3A4652"
  },
  titanium: {
    900: "#34383D",
    700: "#626A73",
    500: "#A8AFB8",
    300: "#D7DBDF"
  },
  gold: {
    700: "#8C6A2F",
    600: "#B78A3B",
    500: "#D6B25E",
    300: "#F1DA96"
  },
  bronze: {
    700: "#775334",
    500: "#A36F43",
    300: "#C99B68"
  },
  pearl: {
    50: "#FAF8F2",
    100: "#F1EEE5",
    200: "#DED8CB"
  },
  blueBlack: {
    950: "#030711",
    900: "#07111F",
    800: "#0D1B2D",
    700: "#152A43"
  },
  signal: {
    success: "#45B987",
    warning: "#D8A842",
    danger: "#D96459",
    info: "#6A9FD8"
  }
} as const satisfies Record<string, ColorScale>;

export const semanticColors = {
  surface: {
    canvas: primitiveColors.black[950],
    base: primitiveColors.black[900],
    raised: primitiveColors.charcoal[900],
    panel: primitiveColors.gunmetal[900],
    inset: primitiveColors.blueBlack[950],
    inverse: primitiveColors.pearl[50]
  },
  material: {
    brushedTitanium: primitiveColors.titanium[700],
    titaniumHighlight: primitiveColors.titanium[300],
    gunmetal: primitiveColors.gunmetal[800],
    champagneGold: primitiveColors.gold[300],
    softGold: primitiveColors.gold[500],
    mutedBronze: primitiveColors.bronze[500]
  },
  content: {
    primary: primitiveColors.pearl[50],
    secondary: primitiveColors.titanium[300],
    muted: primitiveColors.titanium[500],
    inverse: primitiveColors.black[950],
    accent: primitiveColors.gold[300]
  },
  border: {
    subtle: "rgba(250, 248, 242, 0.08)",
    muted: "rgba(250, 248, 242, 0.14)",
    strong: "rgba(241, 218, 150, 0.42)",
    focus: primitiveColors.gold[300]
  },
  action: {
    primary: primitiveColors.gold[500],
    primaryHover: primitiveColors.gold[300],
    secondary: primitiveColors.gunmetal[700],
    secondaryHover: primitiveColors.gunmetal[600],
    ghostHover: "rgba(250, 248, 242, 0.08)"
  },
  status: {
    success: primitiveColors.signal.success,
    warning: primitiveColors.signal.warning,
    danger: primitiveColors.signal.danger,
    info: primitiveColors.signal.info
  }
} as const;

export const colorTokens = {
  primitive: primitiveColors,
  semantic: semanticColors
} as const;

export type ColorTokens = typeof colorTokens;
export type SemanticColorTokens = typeof semanticColors;
