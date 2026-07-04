import type { ReceptionistRequest } from "@bidayax/types";
import { assessPromptInjection } from "./prompt-injection-guard";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s.0-9]{7,40}$/;

export function evaluateReceptionistSafety(request: ReceptionistRequest) {
  const reasons: string[] = [];
  const messageAssessment = assessPromptInjection(request.message);
  const nameAssessment = assessPromptInjection(request.name);

  if (!request.consent) {
    reasons.push("consent_required");
  }

  if (!emailPattern.test(request.email)) {
    reasons.push("invalid_email");
  }

  if (request.phone && !phonePattern.test(request.phone)) {
    reasons.push("invalid_phone");
  }

  if (request.message.length > 2000) {
    reasons.push("message_too_large");
  }

  if (messageAssessment.blocked || nameAssessment.blocked) {
    reasons.push("prompt_injection_guard_blocked");
  }

  return {
    allowed: reasons.length === 0,
    reasonCodes: [...new Set([...reasons, ...messageAssessment.reasonCodes])],
    sanitizedMessage: messageAssessment.sanitizedText
  };
}
