import type { RuntimeIntentClassification } from "./types";

const intentRules = [
  { intent: "schedule_meeting", match: /\b(meeting|calendar|appointment|schedule|book)\b/iu },
  { intent: "request_callback", match: /\b(call me|callback|call back|return my call)\b/iu },
  { intent: "qualify_lead", match: /\b(budget|enterprise|proposal|buy|sales|pricing)\b/iu },
  { intent: "partnership_request", match: /\b(partner|partnership|alliance|investor)\b/iu },
  { intent: "support_request", match: /\b(support|issue|problem|help)\b/iu },
  { intent: "route_message", match: /\b(message|tell|forward|route)\b/iu },
  { intent: "sensitive_request", match: /\b(contract|payment|legal advice|medical|guarantee|promise returns)\b/iu }
] as const;

export function classifyRuntimeIntent(transcript: string): RuntimeIntentClassification {
  const normalized = transcript.trim();

  if (!normalized) {
    return {
      confidence: 0,
      intent: "unknown",
      reasonCodes: ["EMPTY_TRANSCRIPT"]
    };
  }

  const match = intentRules.find((rule) => rule.match.test(normalized));

  if (!match) {
    return {
      confidence: 0.42,
      intent: "general_inquiry",
      reasonCodes: ["DEFAULT_GENERAL_INQUIRY"]
    };
  }

  return {
    confidence: match.intent === "sensitive_request" ? 0.93 : 0.78,
    intent: match.intent,
    reasonCodes: [`MATCHED_${match.intent.toUpperCase()}`]
  };
}