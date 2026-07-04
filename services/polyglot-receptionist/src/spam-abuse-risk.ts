import { assessPromptInjection } from "./prompt-injection-guard";

const spamPatterns = [
  /guaranteed\s+returns/i,
  /crypto\s+giveaway/i,
  /lottery/i,
  /cheap\s+traffic/i,
  /backlinks?/i,
  /wire\s+transfer/i,
  /gift\s+cards?/i
] as const;

export type SpamAbuseRiskResult = {
  readonly score: number;
  readonly blocked: boolean;
  readonly reasonCodes: readonly string[];
  readonly sanitizedTranscript: string;
};

export function classifySpamAndAbuseRisk(input: {
  readonly transcript: string;
  readonly callerPhone: string;
  readonly requestCountForWindow?: number;
}): SpamAbuseRiskResult {
  const assessment = assessPromptInjection(input.transcript);
  const reasonCodes: string[] = [...assessment.reasonCodes];
  let score = assessment.blocked ? 55 : 0;

  for (const pattern of spamPatterns) {
    if (pattern.test(assessment.sanitizedText)) {
      score += 20;
      reasonCodes.push("spam_phrase_detected");
    }
  }

  if (!/^\+?[0-9().\-\s]{7,40}$/.test(input.callerPhone)) {
    score += 20;
    reasonCodes.push("invalid_caller_phone");
  }

  if ((input.requestCountForWindow ?? 0) >= 5) {
    score += 35;
    reasonCodes.push("request_burst_detected");
  }

  const boundedScore = Math.min(100, score);

  return {
    blocked: boundedScore >= 75,
    reasonCodes: [...new Set(reasonCodes)],
    sanitizedTranscript: assessment.sanitizedText,
    score: boundedScore
  };
}
