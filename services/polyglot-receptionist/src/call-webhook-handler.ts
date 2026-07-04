import { receptionistLanguages, receptionistRequestTypes } from "@bidayax/types";
import type { ExecutiveSlug, ReceptionistRequest } from "@bidayax/types";

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
    requestType: receptionistRequestTypes.includes("request_callback") ? "request_callback" : "general_inquiry",
    ...(payload.dialect ? { dialect: payload.dialect } : {})
  };
}

