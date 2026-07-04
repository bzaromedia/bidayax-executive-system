import type {
  CallIntent,
  ReceptionistAction,
  VoiceTrustScore
} from "@bidayax/types";

const sensitiveActionIntents: readonly CallIntent[] = ["legal", "emergency", "investor"];

export type EscalationDecision = {
  readonly requiresHumanApproval: boolean;
  readonly shouldEscalate: boolean;
  readonly reasonCodes: readonly string[];
};

export function decideReceptionistEscalation(input: {
  readonly intent: CallIntent;
  readonly trust: VoiceTrustScore;
  readonly requestedAction: ReceptionistAction;
  readonly urgencyScore: number;
}) : EscalationDecision {
  const reasonCodes: string[] = [];

  if (sensitiveActionIntents.includes(input.intent)) {
    reasonCodes.push("sensitive_intent");
  }

  if (input.requestedAction === "transfer_call") {
    reasonCodes.push("live_transfer_requested");
  }

  if (input.trust.tier === "risky") {
    reasonCodes.push("risky_caller");
  }

  if (input.urgencyScore >= 80) {
    reasonCodes.push("high_urgency");
  }

  return {
    reasonCodes: [...new Set(reasonCodes)],
    requiresHumanApproval: reasonCodes.length > 0 && input.requestedAction !== "block_spam",
    shouldEscalate: input.urgencyScore >= 80 || sensitiveActionIntents.includes(input.intent)
  };
}
