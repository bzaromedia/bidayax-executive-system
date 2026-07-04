import type { ReceptionistPriority, ReceptionistRequest } from "@bidayax/types";

const urgentTerms = ["urgent", "asap", "today", "emergency", "immediate"];
const highValueTerms = ["enterprise", "partnership", "investment", "contract", "procurement"];

export function qualifyReceptionistLead(request: ReceptionistRequest) {
  const text = `${request.company ?? ""} ${request.message}`.toLowerCase();
  const urgencyScore = urgentTerms.some((term) => text.includes(term)) ? 35 : 0;
  const valueScore = highValueTerms.some((term) => text.includes(term)) ? 30 : 0;
  const requestTypeScore = request.requestType === "qualify_lead" || request.requestType === "partnership_request" ? 25 : 10;
  const companyScore = request.company ? 10 : 0;
  const score = Math.min(100, urgencyScore + valueScore + requestTypeScore + companyScore);
  const urgency: ReceptionistPriority = score >= 75 ? "urgent" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";

  return {
    score,
    urgency,
    reasonCodes: [
      request.company ? "company_supplied" : "company_missing",
      requestTypeScore > 10 ? "high_value_request_type" : "standard_request_type",
      urgencyScore > 0 ? "urgent_language_detected" : "no_urgent_language"
    ]
  };
}
