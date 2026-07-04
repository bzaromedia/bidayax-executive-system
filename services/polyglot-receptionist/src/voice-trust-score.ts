import type { CallIntent, CallerProfile, VoiceTrustScore } from "@bidayax/types";

export function calculateVoiceTrustScore(input: {
  readonly caller: CallerProfile;
  readonly companyMatchesExecutiveContext: boolean;
  readonly languageConfidence: number;
  readonly intent: CallIntent;
  readonly spamRiskScore: number;
  readonly sentiment?: "positive" | "neutral" | "negative" | "unknown";
}): VoiceTrustScore {
  const reasonCodes: string[] = [];
  let score = 35;

  if (input.caller.verifiedIdentity) {
    score += 20;
    reasonCodes.push("verified_identity");
  }

  if (input.caller.repeatContactCount > 0) {
    score += Math.min(20, input.caller.repeatContactCount * 5);
    reasonCodes.push("repeat_contact_history");
  }

  if (input.companyMatchesExecutiveContext) {
    score += 15;
    reasonCodes.push("company_context_match");
  }

  if (input.languageConfidence >= 0.75) {
    score += 10;
    reasonCodes.push("language_confidence_high");
  } else {
    score -= 10;
    reasonCodes.push("language_confidence_low");
  }

  if (input.intent === "spam") {
    score -= 45;
    reasonCodes.push("spam_intent_detected");
  }

  if (input.intent === "legal" || input.intent === "emergency") {
    score -= 10;
    reasonCodes.push("sensitive_intent_requires_review");
  }

  if (input.sentiment === "negative") {
    score -= 8;
    reasonCodes.push("negative_sentiment");
  }

  if (input.spamRiskScore >= 70) {
    score -= 30;
    reasonCodes.push("high_spam_risk");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const tier = boundedScore >= 80
    ? "trusted"
    : boundedScore >= 60
      ? "known"
      : boundedScore >= 35
        ? "unverified"
        : "risky";

  return {
    reasonCodes: [...new Set(reasonCodes)],
    score: boundedScore,
    tier
  };
}
