import type { IntentTier } from "@bidayax/types";

export const intentTierRanges = [
  {
    max: 24,
    min: 0,
    tier: "Cold Signal"
  },
  {
    max: 49,
    min: 25,
    tier: "Warm Signal"
  },
  {
    max: 69,
    min: 50,
    tier: "Qualified Signal"
  },
  {
    max: 84,
    min: 70,
    tier: "Executive Priority"
  },
  {
    max: 100,
    min: 85,
    tier: "Strategic Opportunity"
  }
] as const satisfies readonly {
  readonly min: number;
  readonly max: number;
  readonly tier: IntentTier;
}[];

export function getIntentTier(score: number): IntentTier {
  return (
    intentTierRanges.find((range) => score >= range.min && score <= range.max)
      ?.tier ?? "Strategic Opportunity"
  );
}
