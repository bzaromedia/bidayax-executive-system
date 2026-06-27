import { isExecutiveSlug, type TelephonyProviderValidation } from "@bidayax/types";
import type {
  NormalizedInboundCall,
  OutboundCallRequestInput,
  PreparedOutboundCallRequest,
  TelephonyRuntimeConfig
} from "@bidayax/types";
import {
  isMockInboundWebhookPayload,
  type TelephonyProvider
} from "./telephony-provider";
import { createOutboundCallRequest } from "./outbound-call-request";

export class MockTelephonyProvider implements TelephonyProvider {
  getProviderName() {
    return "mock" as const;
  }

  normalizeInboundWebhook(payload: unknown): NormalizedInboundCall {
    if (!isMockInboundWebhookPayload(payload)) {
      throw new Error("Invalid mock inbound webhook payload.");
    }

    if (!isExecutiveSlug(payload.executiveSlug)) {
      throw new Error("Invalid executive slug.");
    }

    return {
      dialect: payload.dialect ?? null,
      direction: "inbound",
      executiveSlug: payload.executiveSlug,
      fromNumber: payload.fromNumber,
      language: payload.language ?? null,
      provider: "mock",
      providerCallId: payload.providerCallId,
      status: "received",
      toNumber: payload.toNumber
    };
  }

  createOutboundCallRequest(
    input: OutboundCallRequestInput,
    config: TelephonyRuntimeConfig
  ): PreparedOutboundCallRequest {
    return createOutboundCallRequest(input, config);
  }

  validateProviderConfig(
    config: TelephonyRuntimeConfig
  ): TelephonyProviderValidation {
    return {
      provider: "mock",
      reasonCodes:
        config.provider === "mock" ? [] : ["MOCK_PROVIDER_NOT_SELECTED"],
      valid: config.provider === "mock"
    };
  }
}
