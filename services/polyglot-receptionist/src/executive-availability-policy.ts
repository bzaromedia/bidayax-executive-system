import type {
  CallIntent,
  ExecutiveReceptionistPolicy,
  ReceptionistAction,
  VoiceTrustScore
} from "@bidayax/types";

export function createDefaultExecutiveReceptionistPolicy(
  executiveSlug: ExecutiveReceptionistPolicy["executiveSlug"]
): ExecutiveReceptionistPolicy {
  return {
    allowedLanguages: ["English", "Spanish", "Arabic", "French", "Hindi", "Urdu", "Mandarin"],
    blockedCallerPhones: [],
    businessHoursTimezone: "America/New_York",
    callbackEnabled: true,
    executiveSlug,
    priorityCompanies: ["BidayaX LLC"],
    requireHumanApprovalFor: ["legal", "emergency", "investor"],
    scheduleEnabled: true,
    transferEnabled: false
  };
}

export type AvailabilityPolicyDecision = {
  readonly action: ReceptionistAction;
  readonly requiresHumanApproval: boolean;
  readonly reasonCodes: readonly string[];
};

export function decideExecutiveAvailability(input: {
  readonly intent: CallIntent;
  readonly policy: ExecutiveReceptionistPolicy;
  readonly trust: VoiceTrustScore;
  readonly requestedMeeting: boolean;
  readonly requestedCallback: boolean;
}): AvailabilityPolicyDecision {
  const reasonCodes: string[] = [];

  if (input.intent === "spam" || input.trust.tier === "risky") {
    return {
      action: "block_spam",
      reasonCodes: ["spam_or_risky_caller"],
      requiresHumanApproval: false
    };
  }

  if (input.policy.requireHumanApprovalFor.includes(input.intent)) {
    return {
      action: "request_human_approval",
      reasonCodes: ["sensitive_intent_requires_human_approval"],
      requiresHumanApproval: true
    };
  }

  if (input.policy.transferEnabled && input.trust.score >= 85) {
    return {
      action: "transfer_call",
      reasonCodes: ["trusted_caller_transfer_allowed"],
      requiresHumanApproval: false
    };
  }

  if (input.requestedMeeting && input.policy.scheduleEnabled) {
    reasonCodes.push("meeting_request_queued");
    return {
      action: "book_meeting",
      reasonCodes,
      requiresHumanApproval: false
    };
  }

  if (input.requestedCallback && input.policy.callbackEnabled) {
    reasonCodes.push("callback_request_queued");
    return {
      action: "request_callback",
      reasonCodes,
      requiresHumanApproval: false
    };
  }

  return {
    action: input.intent === "sales" || input.intent === "partner" ? "qualify_lead" : "take_message",
    reasonCodes: ["queued_for_human_follow_up"],
    requiresHumanApproval: false
  };
}
