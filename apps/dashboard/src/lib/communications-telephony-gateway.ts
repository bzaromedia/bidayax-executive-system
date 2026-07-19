import {
  createPhase11aDisabledAcceptance,
  phase11aExecutionDisabledReasonCode
} from "@bidayax/communications";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createDisabledTwiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escapeXml(message)}</Say><Hangup /></Response>`;
}

function createDisabledReasonCodes(surface:
  | "inbound_telephony_webhook"
  | "outbound_telephony_request"
  | "twilio_inbound_webhook") {
  return createPhase11aDisabledAcceptance({
    channel: "telephony",
    surface
  }).reasonCodes;
}

export async function handleDashboardInboundTelephonyWebhook() {
  return {
    ok: false,
    provider: "telephony",
    reasonCodes: createDisabledReasonCodes("inbound_telephony_webhook"),
    status: "disabled",
    statusCode: 503 as const
  };
}

export async function handleDashboardOutboundTelephonyRequest() {
  return {
    error: "Communications execution remains disabled in Phase 11A.",
    ok: false,
    reasonCodes: createDisabledReasonCodes("outbound_telephony_request"),
    statusCode: 503 as const
  };
}

export async function handleDashboardTwilioInboundTelephonyWebhook() {
  return {
    statusCode: 503 as const,
    twiml: createDisabledTwiml(
      "BidayaX reception is not accepting live telephony execution during Phase 11A. Goodbye."
    ),
    validation: {
      valid: false,
      reasonCodes: createDisabledReasonCodes("twilio_inbound_webhook"),
      signingChecked: false,
      status: phase11aExecutionDisabledReasonCode
    }
  };
}

export function createMalformedTwilioInboundResponse() {
  return {
    statusCode: 400 as const,
    twiml: createDisabledTwiml(
      "BidayaX reception received an invalid request. Goodbye."
    )
  };
}