import type {
  MockInboundWebhookPayload,
  NormalizedInboundCall,
  OutboundCallRequestInput,
  PreparedOutboundCallRequest,
  TelephonyProviderName,
  TelephonyProviderValidation,
  TelephonyRuntimeConfig
} from "@bidayax/types";

export type TelephonyProvider = {
  readonly getProviderName: () => TelephonyProviderName;
  readonly normalizeInboundWebhook: (
    payload: unknown
  ) => NormalizedInboundCall;
  readonly createOutboundCallRequest: (
    input: OutboundCallRequestInput,
    config: TelephonyRuntimeConfig
  ) => PreparedOutboundCallRequest;
  readonly validateProviderConfig: (
    config: TelephonyRuntimeConfig
  ) => TelephonyProviderValidation;
};

export function isMockInboundWebhookPayload(
  payload: unknown
): payload is MockInboundWebhookPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    candidate.provider === "mock" &&
    typeof candidate.providerCallId === "string" &&
    typeof candidate.fromNumber === "string" &&
    typeof candidate.toNumber === "string" &&
    typeof candidate.executiveSlug === "string"
  );
}
