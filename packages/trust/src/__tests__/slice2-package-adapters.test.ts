import { describe, expect, it } from "vitest";
import { createSignedIdentitySecurityEvidence } from "../../../identity/src/trust-evidence";
import { createSignedReceptionistEvidence } from "../../../receptionist-runtime/src/trust-evidence";
import { createSignedTelephonyEvidence } from "../../../../services/telephony/src/trust-evidence";
import { keyFixture, signedAt } from "./test-helpers";

describe("package-level signed evidence adapters", () => {
  it("signs sanitized identity evidence in the identity audit domain", async () => {
    const { key, provider } = keyFixture("audit_chain_signing");
    const result = await createSignedIdentitySecurityEvidence({ attributes: { providerResult: "accepted" }, cardId: null, eventType: "identity.security_webhook_result", key, occurredAt: signedAt, outcome: "accepted", provider, reasonCode: "SIGNATURE_VALID", signerId: key.identityId, subjectId: "webhook-hash", tenantId: key.tenantId });
    expect(result.envelope.domain).toBe("identity.audit"); expect(result.envelope.payload).not.toHaveProperty("accessToken");
  });
  it("signs telephony safety evidence without call content", async () => {
    const { key, provider } = keyFixture("platform_artifact_signing");
    const result = await createSignedTelephonyEvidence({ attributes: { decision: "blocked", providerMode: "disabled" }, cardId: "card-1", eventType: "telephony.safety_decision", key, occurredAt: signedAt, outcome: "denied", provider, reasonCode: "PRODUCTION_CALLING_DISABLED", signerId: key.identityId, subjectId: "command-hash", tenantId: key.tenantId });
    expect(result.envelope.domain).toBe("telephony.safety"); expect(JSON.stringify(result)).not.toMatch(/transcript|audio/i);
  });
  it("signs receptionist tool authorization without transcript or PII", async () => {
    const { key, provider } = keyFixture("platform_artifact_signing");
    const result = await createSignedReceptionistEvidence({ attributes: { decision: "human_approval_required", tool: "calendar" }, cardId: "card-1", eventType: "receptionist.tool_authorization", key, occurredAt: signedAt, outcome: "denied", provider, reasonCode: "APPROVAL_REQUIRED", signerId: key.identityId, subjectId: "tool-request-hash", tenantId: key.tenantId });
    expect(result.envelope.domain).toBe("receptionist.tool_authorization"); expect(JSON.stringify(result)).not.toMatch(/email|phone|transcript|audio/i);
  });
});
