export const zIndexTokens = {
  base: 0,
  raised: 10,
  sticky: 100,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
  tooltip: 1300
} as const;

export type ZIndexTokens = typeof zIndexTokens;
