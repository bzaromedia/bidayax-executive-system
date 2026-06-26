export const durationTokens = {
  instant: "0ms",
  fast: "120ms",
  normal: "180ms",
  slow: "260ms",
  deliberate: "420ms"
} as const;

export const easingTokens = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.7, 0, 0.84, 0)",
  emphasis: "cubic-bezier(0.22, 1, 0.36, 1)"
} as const;

export const motionTokens = {
  duration: durationTokens,
  easing: easingTokens,
  reducedMotion:
    "All motion must remain optional and respect reduced-motion preferences."
} as const;

export type MotionTokens = typeof motionTokens;
