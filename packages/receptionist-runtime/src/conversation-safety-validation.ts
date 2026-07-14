import { evaluateRuntimeConsent } from "./consent-policy";
import { redactRuntimeText } from "./redaction-policy";
import { resolveRuntimeRetentionPolicy } from "./retention-policy";
import { assessRuntimeSafety } from "./runtime-safety";
import type { ConversationSafetyValidationInput, ConversationSafetyValidationResult } from "./types";

export function validateConversationSafety(input: ConversationSafetyValidationInput): ConversationSafetyValidationResult {
  const redaction = redactRuntimeText(input.transcript, input.redactionPolicy);
  const consent = evaluateRuntimeConsent({
    ...(input.consent ? { consent: input.consent } : {}),
    mode: input.mode,
    ...(input.consentPolicy ? { policy: input.consentPolicy } : {})
  });
  const retention = resolveRuntimeRetentionPolicy(input.retentionPolicy);
  const safety = assessRuntimeSafety(input.transcript, input.redactionPolicy);
  const reasonCodes = [
    ...consent.reasonCodes,
    ...retention.reasonCodes,
    ...redaction.applied,
    ...safety.reasonCodes
  ];

  if (!consent.allowed) {
    return {
      consent,
      decision: "block",
      reasonCodes,
      redaction,
      retention,
      safety: {
        ...safety,
        decision: "block",
        reasonCodes: [...safety.reasonCodes, "CONSENT_POLICY_BLOCK"]
      }
    };
  }

  if (!retention.allowed) {
    return {
      consent,
      decision: "block",
      reasonCodes,
      redaction,
      retention,
      safety: {
        ...safety,
        decision: "block",
        reasonCodes: [...safety.reasonCodes, "RETENTION_POLICY_BLOCK"]
      }
    };
  }

  return {
    consent,
    decision: safety.decision,
    reasonCodes,
    redaction,
    retention,
    safety: {
      ...safety,
      sanitizedTranscriptPreview: redaction.redactedText
    }
  };
}
