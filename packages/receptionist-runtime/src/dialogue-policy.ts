import type { RuntimeDialogueResponse, RuntimeIntentClassification, RuntimeLanguageProfile, RuntimeToolPlan } from "./types";

export function createRuntimeDialogueResponse(input: {
  readonly intent: RuntimeIntentClassification;
  readonly language: RuntimeLanguageProfile;
  readonly toolPlan: RuntimeToolPlan;
}): RuntimeDialogueResponse {
  if (input.toolPlan.requiresHumanApproval) {
    return {
      requiresHumanApproval: true,
      shouldEndSession: false,
      text: "I can take the details and route this for executive review. I cannot approve sensitive requests or make commitments."
    };
  }

  const prefix = input.language.language === "English"
    ? "I can help with that."
    : "I can help with that and will preserve the detected language context.";

  const responses: Record<RuntimeToolPlan["toolName"], string> = {
    appointment_request: "I will prepare a meeting request and pass it to the executive workflow.",
    callback_request: "I will queue a callback request with the details you provided.",
    human_approval: "I will route this to a human for review before any action is taken.",
    lead_qualification: "I will capture the opportunity details and route them for qualification.",
    message_capture: "I will capture your message and route it to the right executive contact.",
    safe_fallback: "I will take a concise message and ask for human follow-up if needed.",
    support_intake: "I will capture the support request and route it for follow-up."
  };

  return {
    requiresHumanApproval: false,
    shouldEndSession: input.intent.intent !== "unknown",
    text: `${prefix} ${responses[input.toolPlan.toolName]}`
  };
}