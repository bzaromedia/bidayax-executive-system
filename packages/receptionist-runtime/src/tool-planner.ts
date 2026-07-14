import type { RuntimeIntentClassification, RuntimeToolPlan } from "./types";

export function planRuntimeTool(intent: RuntimeIntentClassification): RuntimeToolPlan {
  if (intent.intent === "sensitive_request") {
    return {
      providerStatus: "requires_human_review",
      reasonCodes: ["SENSITIVE_REQUEST_REQUIRES_HUMAN_APPROVAL"],
      requiresHumanApproval: true,
      toolName: "human_approval"
    };
  }

  const mapping: Record<Exclude<typeof intent.intent, "sensitive_request">, RuntimeToolPlan["toolName"]> = {
    general_inquiry: "message_capture",
    partnership_request: "human_approval",
    qualify_lead: "lead_qualification",
    request_callback: "callback_request",
    route_message: "message_capture",
    schedule_meeting: "appointment_request",
    support_request: "support_intake",
    unknown: "safe_fallback"
  };
  const toolName = mapping[intent.intent as Exclude<typeof intent.intent, "sensitive_request">];
  const requiresHumanApproval = toolName === "human_approval";

  return {
    providerStatus: requiresHumanApproval ? "requires_human_review" : "provider_unconfigured",
    reasonCodes: requiresHumanApproval ? ["HUMAN_APPROVAL_REQUIRED"] : ["PROVIDER_NEUTRAL_TOOL_PLAN"],
    requiresHumanApproval,
    toolName
  };
}