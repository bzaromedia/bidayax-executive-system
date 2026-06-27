import type { NormalizedInboundCall } from "@bidayax/types";
import { MockTelephonyProvider } from "./mock-telephony-provider";

function logTelephonyEvent(
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console.info(
    JSON.stringify({
      component: "live-voice-telephony-preparation",
      event,
      ...details
    })
  );
}

export function normalizeInboundWebhook(payload: unknown): NormalizedInboundCall {
  logTelephonyEvent("inbound_webhook_received");

  try {
    const provider = new MockTelephonyProvider();
    const normalized = provider.normalizeInboundWebhook(payload);

    logTelephonyEvent("inbound_webhook_validated", {
      provider: normalized.provider
    });

    return normalized;
  } catch (error) {
    logTelephonyEvent("inbound_webhook_rejected");
    throw error;
  }
}
