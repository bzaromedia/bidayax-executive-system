import { describe, expect, it } from "vitest";
import {
  createSandboxTelephonyProvider,
  signSandboxWebhook
} from "../src/sandbox-provider-adapter";

const context = {
  cardId: "card-1",
  sessionId: "session-1",
  tenantId: "tenant-1"
};

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
    const provider = createSandboxTelephonyProvider({ mode: "sandbox" });
    const session = {} as Parameters<typeof provider.calls.requestOutboundDial>[1];

    const result = await provider.calls.requestOutboundDial(context, session);

    expect(result.accepted).toBe(true);
    expect(result.providerReference).toBe("sandbox:outbound-dial:session-1");
    expect(result.reasonCodes).toContain("PRODUCTION_CALLING_DISABLED");
  });

  it("blocks production provider mode", async () => {
    const provider = createSandboxTelephonyProvider({ mode: "production" });
    const session = {} as Parameters<typeof provider.calls.requestOutboundDial>[1];

    const result = await provider.calls.requestOutboundDial(context, session);

    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain("PRODUCTION_PROVIDER_MODE_BLOCKED");
  });

  it("verifies and normalizes signed sandbox webhooks", async () => {
    const rawBody = JSON.stringify({
      cardId: "card-1",
      eventType: "call.received",
      providerEventId: "sandbox-event-1",
      sessionId: "session-1",
      tenantId: "tenant-1"
    });
    const secret = "test-sandbox-secret";
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      now: () => "2026-07-14T00:00:00.000Z",
      webhookSigningSecret: secret
    });

    const verification = await provider.webhooks.verifyWebhook({
      headers: {
        "x-bidayax-sandbox-signature": signSandboxWebhook(rawBody, secret)
      },
      rawBody
    });
    const normalized = await provider.webhooks.normalizeWebhook({
      headers: {
        "x-bidayax-sandbox-signature": signSandboxWebhook(rawBody, secret)
      },
      rawBody
    });

    expect(verification.valid).toBe(true);
    expect(normalized.auditEvent?.eventType).toBe("telephony.sandbox.call.received");
    expect(normalized.auditEvent?.tenantId).toBe("tenant-1");
    expect(normalized.auditEvent?.metadata).not.toHaveProperty("rawBody");
  });

  it("rejects missing or invalid sandbox webhook signatures", async () => {
    const provider = createSandboxTelephonyProvider({
      mode: "sandbox",
      webhookSigningSecret: "test-sandbox-secret"
    });

    await expect(
      provider.webhooks.verifyWebhook({ headers: {}, rawBody: "{}" })
    ).resolves.toMatchObject({
      reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_MISSING"],
      valid: false
    });

    await expect(
      provider.webhooks.verifyWebhook({
        headers: { "x-bidayax-sandbox-signature": "sha256=bad" },
        rawBody: "{}"
      })
    ).resolves.toMatchObject({
      reasonCodes: ["SANDBOX_WEBHOOK_SIGNATURE_INVALID"],
      valid: false
    });
  });
});
