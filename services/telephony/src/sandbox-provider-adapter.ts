import { Buffer } from "node:buffer";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { TelephonyAuditEvent } from "@bidayax/types";
import type {
  ProviderOperationResult,
  TelephonyProvider,
  TelephonyProviderContext
} from "./provider-interface";

export type SandboxTelephonyProviderConfig = {
  readonly mode: "disabled" | "mock" | "sandbox" | "production";
  readonly webhookSigningSecret?: string | null | undefined;
  readonly now?: () => string;
};

type SandboxWebhookPayload = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly sessionId: string | null;
  readonly eventType: string;
  readonly providerEventId: string | null;
};

function disabledResult(reasonCode = "SANDBOX_PROVIDER_DISABLED"): ProviderOperationResult {
  return {
    accepted: false,
    providerReference: null,
    reasonCodes: [reasonCode, "PRODUCTION_CALLING_DISABLED"]
  };
}

function acceptedResult(operation: string, context: TelephonyProviderContext): ProviderOperationResult {
  return {
    accepted: true,
    providerReference: `sandbox:${operation}:${context.sessionId ?? context.cardId}`,
    reasonCodes: ["SANDBOX_OPERATION_ACCEPTED", "PRODUCTION_CALLING_DISABLED"]
  };
}

function rejectIfNotSandbox(mode: SandboxTelephonyProviderConfig["mode"]) {
  if (mode === "production") {
    return disabledResult("PRODUCTION_PROVIDER_MODE_BLOCKED");
  }

  return mode === "sandbox" ? null : disabledResult();
}

function computeSandboxSignature(rawBody: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function parseSandboxWebhookPayload(rawBody: string): SandboxWebhookPayload | null {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;

    if (
      typeof parsed.tenantId !== "string" ||
      typeof parsed.eventType !== "string"
    ) {
      return null;
    }

    return {
      cardId: typeof parsed.cardId === "string" ? parsed.cardId : null,
      eventType: parsed.eventType,
      providerEventId:
        typeof parsed.providerEventId === "string" ? parsed.providerEventId : null,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      tenantId: parsed.tenantId
    };
  } catch {
    return null;
  }
}

function hashBody(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function signSandboxWebhook(rawBody: string, secret: string) {
  return computeSandboxSignature(rawBody, secret);
}

export function createSandboxTelephonyProvider({
  mode,
  now = () => new Date().toISOString(),
  webhookSigningSecret
}: SandboxTelephonyProviderConfig): TelephonyProvider {
  const operationGuard = () => rejectIfNotSandbox(mode);

  return {
    calls: {
      requestHangup: async (context) =>
        operationGuard() ?? acceptedResult("hangup", context),
      requestInboundAnswer: async (context) =>
        operationGuard() ?? acceptedResult("inbound-answer", context),
      requestOutboundDial: async (context) =>
        operationGuard() ?? acceptedResult("outbound-dial", context),
      requestTransfer: async (context, destination) => {
        if (!destination.trim()) {
          return disabledResult("SANDBOX_TRANSFER_DESTINATION_REQUIRED");
        }

        return operationGuard() ?? acceptedResult("transfer", context);
      }
    },
    conference: {
      createConference: async () => disabledResult("SANDBOX_CONFERENCE_NOT_IMPLEMENTED")
    },
    messaging: {
      sendMessage: async (context, destination, message) => {
        if (!destination.trim() || !message.trim()) {
          return disabledResult("SANDBOX_MESSAGE_DESTINATION_AND_BODY_REQUIRED");
        }

        return operationGuard() ?? acceptedResult("message", context);
      }
    },
    providerName: "sandbox",
    recording: {
      requestRecordingStart: async () => disabledResult("SANDBOX_RECORDING_NOT_IMPLEMENTED"),
      requestRecordingStop: async () => disabledResult("SANDBOX_RECORDING_NOT_IMPLEMENTED")
    },
    webhooks: {
      normalizeWebhook: async ({ headers, rawBody }) => {
        const verification = await createSandboxTelephonyProvider({
          mode,
          now,
          webhookSigningSecret
        }).webhooks.verifyWebhook({ headers, rawBody });

        if (!verification.valid) {
          return { auditEvent: null };
        }

        const payload = parseSandboxWebhookPayload(rawBody);

        if (!payload) {
          return { auditEvent: null };
        }

        const payloadHash = hashBody(rawBody);
        const auditEvent: TelephonyAuditEvent = {
          actor: {
            actorId: "sandbox-provider",
            actorType: "provider",
            displayName: "Sandbox Provider Adapter"
          },
          cardId: payload.cardId ?? null,
          eventId: `sandbox-webhook-${payloadHash}`,
          eventType: `telephony.sandbox.${payload.eventType}`,
          metadata: {
            payloadHash,
            providerEventId: payload.providerEventId ?? null,
            signatureChecked: true
          },
          occurredAt: now(),
          sessionId: payload.sessionId ?? null,
          severity: "info",
          tenantId: payload.tenantId
        };

        return { auditEvent };
      },
      verifyWebhook: async ({ headers, rawBody }) => {
        if (mode !== "sandbox") {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_MODE_DISABLED"],
            valid: false
          };
        }

        if (!webhookSigningSecret) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_SECRET_MISSING"],
            valid: false
          };
        }

        const signature = headers["x-bidayax-sandbox-signature"];

        if (!signature) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MISSING"],
            valid: false
          };
        }

        const expected = computeSandboxSignature(rawBody, webhookSigningSecret);

        return safeCompare(signature, expected)
          ? { reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_VALID"], valid: true }
          : { reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_INVALID"], valid: false };
      }
    }
  };
}
