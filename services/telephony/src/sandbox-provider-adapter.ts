import { Buffer } from "node:buffer";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { TelephonyAuditEvent } from "@bidayax/types";
import type {
  ProviderOperationResult,
  TelephonyProvider,
  TelephonyProviderContext
} from "./provider-interface";

export const sandboxSignatureVersion = "v1";
export const sandboxSignatureAlgorithm = "hmac-sha256";
export const sandboxWebhookMaxBodyBytes = 16 * 1024;
export const sandboxWebhookTimestampToleranceMs = 5 * 60 * 1000;

export type SandboxProviderMode = "disabled" | "mock" | "sandbox" | "production";

export type SandboxTelephonyProviderConfig = {
  readonly mode: SandboxProviderMode;
  readonly webhookSigningSecret?: string | null | undefined;
  readonly now?: () => string;
  readonly replayStore?: SandboxWebhookReplayStore | undefined;
  readonly operationStore?: SandboxOperationIdempotencyStore | undefined;
  readonly timestampToleranceMs?: number;
  readonly maxBodyBytes?: number;
};

export type SandboxWebhookReplayStore = {
  readonly has: (eventId: string) => boolean;
  readonly remember: (eventId: string) => void;
};

export type SandboxOperationRecord = {
  readonly payloadHash: string;
  readonly result: ProviderOperationResult;
};

export type SandboxOperationIdempotencyStore = {
  readonly get: (idempotencyKey: string) => SandboxOperationRecord | undefined;
  readonly remember: (idempotencyKey: string, record: SandboxOperationRecord) => void;
};

type SandboxWebhookPayload = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly sessionId: string | null;
  readonly eventType: string;
  readonly eventState: string | null;
  readonly providerEventId: string | null;
  readonly providerOperationReference: string | null;
  readonly schemaVersion: string;
};

type SandboxOperationInput = {
  readonly capability: string;
  readonly context: TelephonyProviderContext;
  readonly idempotencyKey?: string | null;
  readonly payload: Record<string, unknown>;
};

function createInMemoryStore<T>() {
  const values = new Map<string, T>();

  return {
    get: (key: string) => values.get(key),
    has: (key: string) => values.has(key),
    remember: (key: string, value: T) => {
      values.set(key, value);
    }
  };
}

export function createInMemorySandboxWebhookReplayStore(): SandboxWebhookReplayStore {
  const store = createInMemoryStore<true>();

  return {
    has: store.has,
    remember: (eventId) => store.remember(eventId, true)
  };
}

export function createInMemorySandboxOperationStore(): SandboxOperationIdempotencyStore {
  const store = createInMemoryStore<SandboxOperationRecord>();

  return {
    get: store.get,
    remember: store.remember
  };
}

function disabledResult(reasonCode = "SANDBOX_PROVIDER_DISABLED"): ProviderOperationResult {
  return {
    accepted: false,
    providerReference: null,
    reasonCodes: [reasonCode, "PRODUCTION_CALLING_DISABLED"]
  };
}

function isStrongSandboxSecret(secret: string | null | undefined): secret is string {
  if (!secret || secret.trim().length < 16) {
    return false;
  }

  const normalized = secret.trim().toLowerCase();
  return ![
    "change-me",
    "changeme",
    "placeholder",
    "test",
    "secret",
    "sandbox-secret"
  ].includes(normalized);
}

function rejectIfNotSandbox(mode: SandboxProviderMode) {
  if (mode === "production") {
    return disabledResult("PRODUCTION_PROVIDER_MODE_BLOCKED");
  }

  return mode === "sandbox" ? null : disabledResult();
}

function stableJson(input: Record<string, unknown>) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)))
  );
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalOperationPayload(input: SandboxOperationInput) {
  return stableJson({
    capability: input.capability,
    cardId: input.context.cardId,
    payload: stableJson(input.payload),
    sessionId: input.context.sessionId ?? null,
    tenantId: input.context.tenantId
  });
}

function acceptedResult(operation: string, context: TelephonyProviderContext): ProviderOperationResult {
  return {
    accepted: true,
    providerReference: `sandbox:${operation}:${context.sessionId ?? context.cardId}`,
    reasonCodes: ["SANDBOX_OPERATION_ACCEPTED", "PRODUCTION_CALLING_DISABLED"]
  };
}

function executeSandboxOperation({
  capability,
  context,
  idempotencyKey,
  mode,
  operationStore,
  payload,
  result
}: SandboxOperationInput & {
  readonly mode: SandboxProviderMode;
  readonly operationStore?: SandboxOperationIdempotencyStore | undefined;
  readonly result: ProviderOperationResult;
}): ProviderOperationResult {
  const modeDecision = rejectIfNotSandbox(mode);

  if (modeDecision) {
    return modeDecision;
  }

  if (!idempotencyKey) {
    return disabledResult("SANDBOX_IDEMPOTENCY_KEY_REQUIRED");
  }

  const payloadHash = hashValue(canonicalOperationPayload({
    capability,
    context,
    idempotencyKey,
    payload
  }));
  const existing = operationStore?.get(idempotencyKey);

  if (existing) {
    return existing.payloadHash === payloadHash
      ? existing.result
      : disabledResult("SANDBOX_IDEMPOTENCY_PAYLOAD_MISMATCH");
  }

  operationStore?.remember(idempotencyKey, { payloadHash, result });
  return result;
}

export function createSandboxSignedPayload({
  eventId,
  rawBody,
  timestamp
}: {
  readonly eventId: string;
  readonly rawBody: string;
  readonly timestamp: string;
}) {
  return `${sandboxSignatureVersion}.${timestamp}.${eventId}.${rawBody}`;
}

function computeSandboxSignature({
  eventId,
  rawBody,
  secret,
  timestamp
}: {
  readonly eventId: string;
  readonly rawBody: string;
  readonly secret: string;
  readonly timestamp: string;
}) {
  return createHmac("sha256", secret)
    .update(createSandboxSignedPayload({ eventId, rawBody, timestamp }))
    .digest("hex");
}

export function signSandboxWebhook({
  eventId,
  rawBody,
  secret,
  timestamp
}: {
  readonly eventId: string;
  readonly rawBody: string;
  readonly secret: string;
  readonly timestamp: string;
}) {
  return `${sandboxSignatureVersion};alg=${sandboxSignatureAlgorithm};sig=${computeSandboxSignature({
    eventId,
    rawBody,
    secret,
    timestamp
  })}`;
}

function parseSandboxSignature(signature: string | undefined) {
  if (!signature) {
    return null;
  }

  const parts = signature.split(";");
  if (parts.length !== 3 || parts[0] !== sandboxSignatureVersion) {
    return null;
  }

  const algorithm = parts[1]?.startsWith("alg=") ? parts[1].slice(4) : null;
  const digest = parts[2]?.startsWith("sig=") ? parts[2].slice(4) : null;

  if (
    algorithm !== sandboxSignatureAlgorithm ||
    !digest ||
    !/^[a-f0-9]{64}$/u.test(digest)
  ) {
    return null;
  }

  return { digest };
}

function safeCompareHex(value: string, expected: string) {
  if (!/^[a-f0-9]{64}$/u.test(value) || !/^[a-f0-9]{64}$/u.test(expected)) {
    return false;
  }

  const valueBuffer = Buffer.from(value, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function getHeader(headers: Record<string, string | undefined>, name: string) {
  const lower = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lower);
  return entry?.[1];
}

function validateTimestamp({
  now,
  timestamp,
  toleranceMs
}: {
  readonly now: () => string;
  readonly timestamp: string | undefined;
  readonly toleranceMs: number;
}) {
  if (!timestamp) {
    return "SANDBOX_WEBHOOK_TIMESTAMP_MISSING";
  }

  const timestampMs = Date.parse(timestamp);
  const nowMs = Date.parse(now());

  if (!Number.isFinite(timestampMs) || !Number.isFinite(nowMs)) {
    return "SANDBOX_WEBHOOK_TIMESTAMP_INVALID";
  }

  const delta = timestampMs - nowMs;

  if (delta < -toleranceMs) {
    return "SANDBOX_WEBHOOK_TIMESTAMP_STALE";
  }

  if (delta > toleranceMs) {
    return "SANDBOX_WEBHOOK_TIMESTAMP_FUTURE";
  }

  return null;
}

function parseSandboxWebhookPayload(rawBody: string): SandboxWebhookPayload | null {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;

    if (
      parsed.schemaVersion !== "sandbox-webhook.v1" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.eventType !== "string" ||
      typeof parsed.providerEventId !== "string"
    ) {
      return null;
    }

    if (parsed.metadata && stableJson(parsed.metadata as Record<string, unknown>).length > 2048) {
      return null;
    }

    return {
      cardId: typeof parsed.cardId === "string" ? parsed.cardId : null,
      eventState: typeof parsed.eventState === "string" ? parsed.eventState : null,
      eventType: parsed.eventType,
      providerEventId: parsed.providerEventId,
      providerOperationReference:
        typeof parsed.providerOperationReference === "string"
          ? parsed.providerOperationReference
          : null,
      schemaVersion: parsed.schemaVersion,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      tenantId: parsed.tenantId
    };
  } catch {
    return null;
  }
}

const supportedSandboxEventTypes = new Set([
  "call.requested",
  "call.queued",
  "call.dialing",
  "call.ringing",
  "call.answered",
  "call.in_conversation",
  "call.held",
  "call.transferred",
  "call.resumed",
  "call.completed",
  "call.failed",
  "call.busy",
  "call.no_answer",
  "call.voicemail",
  "call.cancelled"
]);

export function createSandboxTelephonyProvider({
  maxBodyBytes = sandboxWebhookMaxBodyBytes,
  mode,
  now = () => new Date().toISOString(),
  operationStore,
  replayStore,
  timestampToleranceMs = sandboxWebhookTimestampToleranceMs,
  webhookSigningSecret
}: SandboxTelephonyProviderConfig): TelephonyProvider {
  return {
    calls: {
      requestHangup: async (context) =>
        executeSandboxOperation({
          capability: "hangup",
          context,
          idempotencyKey: context.sessionId ? `hangup:${context.sessionId}` : null,
          mode,
          operationStore,
          payload: {},
          result: acceptedResult("hangup", context)
        }),
      requestInboundAnswer: async (context) =>
        executeSandboxOperation({
          capability: "inbound-answer",
          context,
          idempotencyKey: context.sessionId ? `answer:${context.sessionId}` : null,
          mode,
          operationStore,
          payload: {},
          result: acceptedResult("inbound-answer", context)
        }),
      requestOutboundDial: async (context) =>
        executeSandboxOperation({
          capability: "outbound-dial",
          context,
          idempotencyKey: context.sessionId ? `dial:${context.sessionId}` : null,
          mode,
          operationStore,
          payload: {},
          result: acceptedResult("outbound-dial", context)
        }),
      requestTransfer: async (context, destination) => {
        if (!destination.trim()) {
          return disabledResult("SANDBOX_TRANSFER_DESTINATION_REQUIRED");
        }

        return executeSandboxOperation({
          capability: "transfer",
          context,
          idempotencyKey: context.sessionId ? `transfer:${context.sessionId}` : null,
          mode,
          operationStore,
          payload: { destination },
          result: acceptedResult("transfer", context)
        });
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

        return executeSandboxOperation({
          capability: "message",
          context,
          idempotencyKey: context.sessionId ? `message:${context.sessionId}` : null,
          mode,
          operationStore,
          payload: { destination, messageHash: hashValue(message) },
          result: acceptedResult("message", context)
        });
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
          maxBodyBytes,
          mode,
          now,
          replayStore,
          timestampToleranceMs,
          webhookSigningSecret
        }).webhooks.verifyWebhook({ headers, rawBody });

        if (!verification.valid) {
          return { auditEvent: null };
        }

        const payload = parseSandboxWebhookPayload(rawBody);

        if (!payload || !supportedSandboxEventTypes.has(payload.eventType)) {
          return { auditEvent: null };
        }

        const payloadHash = hashValue(rawBody);
        const auditEvent: TelephonyAuditEvent = {
          actor: {
            actorId: "sandbox-provider",
            actorType: "provider",
            displayName: "Sandbox Provider Adapter"
          },
          cardId: payload.cardId,
          eventId: `sandbox-webhook-${payload.providerEventId}`,
          eventType: `telephony.sandbox.${payload.eventType}`,
          metadata: {
            eventState: payload.eventState,
            payloadHash,
            providerEventId: payload.providerEventId,
            providerOperationReference: payload.providerOperationReference,
            schemaVersion: payload.schemaVersion,
            signatureChecked: true
          },
          occurredAt: now(),
          sessionId: payload.sessionId,
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

        if (!isStrongSandboxSecret(webhookSigningSecret)) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_SECRET_WEAK_OR_MISSING"],
            valid: false
          };
        }

        if (Buffer.byteLength(rawBody, "utf8") > maxBodyBytes) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_BODY_TOO_LARGE"],
            valid: false
          };
        }

        const contentType = getHeader(headers, "content-type");
        if (!contentType?.toLowerCase().startsWith("application/json")) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_CONTENT_TYPE_INVALID"],
            valid: false
          };
        }

        const eventId = getHeader(headers, "x-bidayax-sandbox-event-id");
        if (!eventId) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_EVENT_ID_MISSING"],
            valid: false
          };
        }

        const timestamp = getHeader(headers, "x-bidayax-sandbox-timestamp");
        const timestampFailure = validateTimestamp({
          now,
          timestamp,
          toleranceMs: timestampToleranceMs
        });

        if (timestampFailure) {
          return {
            reasonCodes: [timestampFailure],
            valid: false
          };
        }

        const parsedSignature = parseSandboxSignature(
          getHeader(headers, "x-bidayax-sandbox-signature")
        );

        if (!parsedSignature) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MALFORMED"],
            valid: false
          };
        }

        const expected = computeSandboxSignature({
          eventId,
          rawBody,
          secret: webhookSigningSecret,
          timestamp: timestamp as string
        });

        if (!safeCompareHex(parsedSignature.digest, expected)) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_INVALID"],
            valid: false
          };
        }

        if (replayStore?.has(eventId)) {
          return {
            reasonCodes: ["SANDBOX_WEBHOOK_REPLAY_DETECTED"],
            valid: false
          };
        }

        replayStore?.remember(eventId);

        return {
          reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_VALID"],
          valid: true
        };
      }
    }
  };
}
