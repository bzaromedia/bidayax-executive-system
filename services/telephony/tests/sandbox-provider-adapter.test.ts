import { describe, expect, it } from "vitest";
import {
  createInMemorySandboxOperationStore,
  createInMemorySandboxWebhookReplayStore,
  createSandboxSignedPayload,
  createSandboxTelephonyProvider,
  sandboxSignatureAlgorithm,
  sandboxSignatureVersion,
  signSandboxWebhook
} from "../src/sandbox-provider-adapter";

const context = {
  cardId: "card-1",
  sessionId: "session-1",
  tenantId: "tenant-1"
};
const now = "2026-07-14T00:00:00.000Z";
const timestamp = "2026-07-14T00:00:00.000Z";
const secret = "test-sandbox-secret-32-bytes";

function sandboxBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    cardId: "card-1",
    eventState: "answered",
    eventType: "call.answered",
    providerEventId: "sandbox-event-1",
    providerOperationReference: "sandbox:answer:session-1",
    schemaVersion: "sandbox-webhook.v1",
    sessionId: "session-1",
    tenantId: "tenant-1",
    ...overrides
  });
}

function signedHeaders(rawBody: string, overrides: Record<string, string> = {}) {
  const eventId = overrides["x-bidayax-sandbox-event-id"] ?? "sandbox-event-1";
  const eventTimestamp = overrides["x-bidayax-sandbox-timestamp"] ?? timestamp;

  return {
    "content-type": "application/json",
    "x-bidayax-sandbox-event-id": eventId,
    "x-bidayax-sandbox-signature": signSandboxWebhook({
      eventId,
      rawBody,
      secret,
      timestamp: eventTimestamp
    }),
    "x-bidayax-sandbox-timestamp": eventTimestamp,
    ...overrides
  };
}

describe("sandbox provider adapter", () => {
  it("blocks provider operations unless sandbox mode is enabled", async () => {
    const provider = createSandboxTelephonyProvider({ mode: "disabled" });
    const session = {} as Parameters<typeof provider.calls.requestInboundAnswer>[1];

    const result = await provider.calls.requestInboundAnswer(context, session);

    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain("SANDBOX_PROVIDER_DISABLED");
    expect(result.reasonCodes).toContain("PRODUCTION_CALLING_DISABLED");
  });

  it("accepts deterministic sandbox call operations without enabling production calls", async () => {
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      operationStore: createInMemorySandboxOperationStore()
    });
    const session = {} as Parameters<typeof provider.calls.requestOutboundDial>[1];

    const result = await provider.calls.requestOutboundDial(context, session);

    expect(result.accepted).toBe(true);
    expect(result.providerReference).toBe("sandbox:outbound-dial:session-1");
    expect(result.reasonCodes).toContain("PRODUCTION_CALLING_DISABLED");
  });

  it("returns the original result for duplicate idempotent operations", async () => {
    const operationStore = createInMemorySandboxOperationStore();
    const provider = createSandboxTelephonyProvider({ mode: "sandbox", operationStore });
    const session = {} as Parameters<typeof provider.calls.requestOutboundDial>[1];

    const first = await provider.calls.requestOutboundDial(context, session);
    const second = await provider.calls.requestOutboundDial(context, session);

    expect(second).toEqual(first);
  });

  it("rejects a reused operation key with a different payload", async () => {
    const operationStore = createInMemorySandboxOperationStore();
    const provider = createSandboxTelephonyProvider({ mode: "sandbox", operationStore });

    await provider.calls.requestTransfer(context, "+15551234567");
    const second = await provider.calls.requestTransfer(context, "+15557654321");

    expect(second.accepted).toBe(false);
    expect(second.reasonCodes).toContain("SANDBOX_IDEMPOTENCY_PAYLOAD_MISMATCH");
  });

  it("blocks production provider mode", async () => {
    const provider = createSandboxTelephonyProvider({ mode: "production" });
    const session = {} as Parameters<typeof provider.calls.requestOutboundDial>[1];

    const result = await provider.calls.requestOutboundDial(context, session);

    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain("PRODUCTION_PROVIDER_MODE_BLOCKED");
  });

  it("uses a stable canonical signed payload", () => {
    const rawBody = sandboxBody();

    expect(
      createSandboxSignedPayload({
        eventId: "sandbox-event-1",
        rawBody,
        timestamp
      })
    ).toBe(`${sandboxSignatureVersion}.${timestamp}.sandbox-event-1.${rawBody}`);
    expect(sandboxSignatureAlgorithm).toBe("hmac-sha256");
  });

  it("verifies and normalizes signed sandbox webhooks", async () => {
    const rawBody = sandboxBody();
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      replayStore: createInMemorySandboxWebhookReplayStore(),
      webhookSigningSecret: secret
    });

    const verification = await provider.webhooks.verifyWebhook({
      headers: signedHeaders(rawBody),
      rawBody
    });
    const secondRawBody = sandboxBody({ providerEventId: "sandbox-event-2" });
    const normalized = await provider.webhooks.normalizeWebhook({
      headers: signedHeaders(secondRawBody, { "x-bidayax-sandbox-event-id": "sandbox-event-2" }),
      rawBody: secondRawBody
    });

    expect(verification.valid).toBe(true);
    expect(normalized.auditEvent?.eventType).toBe("telephony.sandbox.call.answered");
    expect(normalized.auditEvent?.tenantId).toBe("tenant-1");
    expect(normalized.auditEvent?.metadata).not.toHaveProperty("rawBody");
  });

  it("rejects missing, malformed, unsupported, or invalid signatures", async () => {
    const rawBody = sandboxBody();
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: secret
    });

    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "x-bidayax-sandbox-signature": "" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MALFORMED"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({
        headers: signedHeaders(rawBody, { "x-bidayax-sandbox-signature": "v2;alg=hmac-sha256;sig=" + "a".repeat(64) }),
        rawBody
      })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MALFORMED"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({
        headers: signedHeaders(rawBody, { "x-bidayax-sandbox-signature": "v1;alg=sha1;sig=" + "a".repeat(64) }),
        rawBody
      })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MALFORMED"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({
        headers: signedHeaders(rawBody, { "x-bidayax-sandbox-signature": `v1;alg=hmac-sha256;sig=${"b".repeat(64)}` }),
        rawBody
      })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_INVALID"], valid: false });
  });

  it("rejects altered body, timestamp, event ID, old timestamp, future timestamp, and replay", async () => {
    const rawBody = sandboxBody();
    const replayStore = createInMemorySandboxWebhookReplayStore();
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      replayStore,
      webhookSigningSecret: secret
    });

    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody), rawBody: sandboxBody({ eventState: "failed" }) })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_INVALID"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "x-bidayax-sandbox-timestamp": "2026-07-14T00:10:01.000Z" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_TIMESTAMP_FUTURE"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "x-bidayax-sandbox-timestamp": "2026-07-13T23:49:59.000Z" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_TIMESTAMP_STALE"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "x-bidayax-sandbox-event-id": "other-event" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_VALID"], valid: true });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "x-bidayax-sandbox-event-id": "other-event" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_REPLAY_DETECTED"], valid: false });
  });

  it("rejects weak secrets, missing content type, oversized bodies, and unknown events", async () => {
    const rawBody = sandboxBody();
    const weakProvider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: "secret"
    });
    const contentTypeProvider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: secret
    });
    const provider = createSandboxTelephonyProvider({
      maxBodyBytes: 10,
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: secret
    });

    await expect(
      weakProvider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_SECRET_WEAK_OR_MISSING"], valid: false });
    await expect(
      contentTypeProvider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody, { "content-type": "text/plain" }), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_CONTENT_TYPE_INVALID"], valid: false });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(rawBody), rawBody })
    ).resolves.toMatchObject({ reasonCodes: ["SANDBOX_WEBHOOK_BODY_TOO_LARGE"], valid: false });

    const unknownBody = sandboxBody({ eventType: "call.unknown", providerEventId: "unknown-event" });
    const unknownProvider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: secret
    });
    const normalized = await unknownProvider.webhooks.normalizeWebhook({
      headers: signedHeaders(unknownBody, { "x-bidayax-sandbox-event-id": "unknown-event" }),
      rawBody: unknownBody
    });

    expect(normalized.auditEvent).toBeNull();
  });

  it("handles unicode and empty JSON bodies deterministically", async () => {
    const unicodeBody = sandboxBody({ eventState: "answered-مرحبا" });
    const emptyBody = "{}";
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => now,
      webhookSigningSecret: secret
    });

    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(unicodeBody), rawBody: unicodeBody })
    ).resolves.toMatchObject({ valid: true });
    await expect(
      provider.webhooks.verifyWebhook({ headers: signedHeaders(emptyBody, { "x-bidayax-sandbox-event-id": "empty-event" }), rawBody: emptyBody })
    ).resolves.toMatchObject({ valid: true });
    await expect(
      provider.webhooks.normalizeWebhook({ headers: signedHeaders(emptyBody, { "x-bidayax-sandbox-event-id": "empty-event-2" }), rawBody: emptyBody })
    ).resolves.toMatchObject({ auditEvent: null });
  });
});
