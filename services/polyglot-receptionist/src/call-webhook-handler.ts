import { receptionistLanguages } from "@bidayax/types";
import type { ExecutiveSlug, ReceptionistRequest, ReceptionistRequestType } from "@bidayax/types";
import { routePolyglotCallIntent } from "./polyglot-intent-routing";

export type InboundCallWebhookPayload = {
  readonly executiveSlug: ExecutiveSlug;
  readonly callerName: string;
  readonly callerEmail: string;
  readonly callerPhone: string;
  readonly preferredLanguage?: string | undefined;
  readonly dialect?: string | undefined;
  readonly transcript?: string | undefined;
  readonly consent: true;
};

function requestTypeFromTranscript(message: string): ReceptionistRequestType {
  const lower = message.toLowerCase();

  if (/\b(meeting|calendar|schedule|appointment)\b/.test(lower)) {
    return "schedule_meeting";
  }

  if (/\b(call back|call me back|callback|return call|phone me)\b/.test(lower)) {
    return "request_callback";
  }

  const routed = routePolyglotCallIntent({ transcript: message });

  if (routed.intent === "partner") {
    return "partnership_request";
  }

  if (routed.intent === "sales" || routed.intent === "investor") {
    return "qualify_lead";
  }

  if (routed.intent === "customer") {
    return "support_request";
  }

  return "route_message";
}

export function normalizeInboundCallWebhook(
  payload: InboundCallWebhookPayload
): ReceptionistRequest {
  const language = receptionistLanguages.find(
    (candidate) => candidate === payload.preferredLanguage
  ) ?? "English";
  const message = payload.transcript?.trim() || "Inbound call request received for executive follow-up.";

  return {
    consent: true,
    email: payload.callerEmail,
    executiveSlug: payload.executiveSlug,
    message,
    name: payload.callerName,
    phone: payload.callerPhone,
    preferredLanguage: language,
    requestType: requestTypeFromTranscript(message),
    ...(payload.dialect ? { dialect: payload.dialect } : {})
  };
}
