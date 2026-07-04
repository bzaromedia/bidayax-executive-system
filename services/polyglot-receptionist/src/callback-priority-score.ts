import type { CallIntent, VoiceTrustScore } from "@bidayax/types";

const intentPriority = {
  investor: 95,
  partner: 90,
  sales: 82,
  customer: 78,
  emergency: 75,
  legal: 72,
  media: 60,
  vendor: 45,
  personal: 40,
  unknown: 35,
  spam: 0
} as const satisfies Record<CallIntent, number>;

export function calculateCallbackPriorityScore(input: {
  readonly intent: CallIntent;
  readonly trust: VoiceTrustScore;
  readonly urgencyScore: number;
  readonly existingClient: boolean;
}) {
  const clientBoost = input.existingClient ? 12 : 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(intentPriority[input.intent] * 0.45 + input.trust.score * 0.35 + input.urgencyScore * 0.2 + clientBoost)
    )
  );

  return {
    priorityBand: score >= 85 ? "strategic" : score >= 65 ? "high" : score >= 40 ? "standard" : "low",
    score
  } as const;
}
