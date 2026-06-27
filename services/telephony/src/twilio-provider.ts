import type {
  NormalizedInboundCall,
  TelephonyProviderValidation,
  TelephonyRuntimeConfig,
  TwilioInboundWebhookPayload
} from "@bidayax/types";
import { isExecutiveSlug } from "@bidayax/types";
import type { TelephonyProvider } from "./telephony-provider";
import { createOutboundCallRequest } from "./outbound-call-request";

export function isTwilioInboundWebhookPayload(
  payload: unknown
): payload is TwilioInboundWebhookPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.AccountSid === "string" &&
    typeof candidate.CallSid === "string" &&
    typeof candidate.From === "string" &&
    typeof candidate.To === "string"
  );
}

function mapTwilioCallStatus(status: string | undefined) {
  switch (status) {
    case "queued":
      return "queued";
    case "ringing":
      return "ringing";
    case "in-progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "failed":
    case "busy":
    case "no-answer":
      return "failed";
    case "canceled":
      return "cancelled";
    default:
      return "received";
  }
}

export class TwilioProvider implements TelephonyProvider {
  readonly getProviderName = () => "twilio" as const;

  readonly normalizeInboundWebhook = (payload: unknown): NormalizedInboundCall => {
    if (!isTwilioInboundWebhookPayload(payload)) {
      throw new Error("Malformed Twilio inbound webhook payload.");
    }

    const executiveSlug = payload.executiveSlug ?? "ad-garner";

    if (!isExecutiveSlug(executiveSlug)) {
      throw new Error("Invalid executive slug.");
    }

    return {
      dialect: null,
      direction: "inbound",
      executiveSlug,
      fromNumber: payload.From,
      language: "English",
      provider: "twilio",
      providerCallId: payload.CallSid,
      status: mapTwilioCallStatus(payload.CallStatus) === "received"
        ? "received"
        : "received",
      toNumber: payload.To
    };
  };

  readonly createOutboundCallRequest = createOutboundCallRequest;

  readonly validateProviderConfig = (
    config: TelephonyRuntimeConfig
  ): TelephonyProviderValidation => {
    const reasonCodes = [];

    if (config.provider !== "twilio") {
      reasonCodes.push("PROVIDER_NOT_TWILIO");
    }

    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      reasonCodes.push("TWILIO_CONFIG_MISSING");
    }

    return {
      provider: "twilio",
      reasonCodes,
      valid: reasonCodes.length === 0
    };
  };
}

