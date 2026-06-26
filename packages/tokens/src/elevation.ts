export const elevationTokens = {
  none: "none",
  hairline: "inset 0 0 0 1px rgba(250, 248, 242, 0.08)",
  raised: "0 10px 30px rgba(0, 0, 0, 0.32)",
  floating: "0 18px 60px rgba(0, 0, 0, 0.42)",
  focus: "0 0 0 3px rgba(241, 218, 150, 0.34)"
} as const;

export type ElevationTokens = typeof elevationTokens;
