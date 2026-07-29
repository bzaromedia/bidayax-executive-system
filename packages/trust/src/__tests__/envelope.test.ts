import { describe, expect, it } from "vitest";
import { buildCryptographicEnvelope, verifyCryptographicEnvelope, type BuildEnvelopeInput } from "../envelope";
import { createProvenanceManifest } from "../provenance";
import type { CanonicalValue } from "../canonicalization";
import type { CryptographicEnvelope, TrustKey } from "../types";
import { keyFixture, keyResolver, signedAt, verifiedAt } from "./test-helpers";

function input(key: TrustKey, provider: ReturnType<typeof keyFixture>["provider"]): BuildEnvelopeInput<CanonicalValue> {
  return {
    artifactId: "settings-1", artifactType: "settings_snapshot", artifactVersion: "7",
    cardId: "card-1", domain: "settings.snapshot", expiresAt: "2026-07-18T10:00:00.000Z",
    key, metadata: { classification: "internal" }, payload: { enabled: true, threshold: "12.50" },
    previousDigest: null, previousEnvelopeId: null, provenanceManifestId: null, provider,
    schemaVersion: "settings-1", signedAt, signerId: "identity-1", signerType: "tenant",
    status: "active", tenantId: "tenant-1"
  };
}

async function builtEnvelope(): Promise<{ envelope: CryptographicEnvelope; key: TrustKey; provider: ReturnType<typeof keyFixture>["provider"] }> {
  const { key, provider } = keyFixture();
  return { envelope: await buildCryptographicEnvelope(input(key, provider)), key, provider };
}

function verify(envelope: unknown, key: TrustKey | null, extra: Partial<Parameters<typeof verifyCryptographicEnvelope>[0]> = {}) {
  return verifyCryptographicEnvelope({ allowRetiredHistorical: false, envelope, keyResolver: keyResolver(key), verifiedAt, ...extra });
}

describe("complete cryptographic envelope", () => {
  it("binds every critical field, normalizes payload/timestamps, freezes output, and verifies", async () => {
    const { envelope, key } = await builtEnvelope();
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(envelope).toMatchObject({
      algorithmPolicyVersion: "trust-algorithm-policy-1", artifactType: "settings_snapshot",
      canonicalizationVersion: "bidayax-c14n-1", digestAlgorithm: "SHA-256", domain: "settings.snapshot",
      envelopeVersion: "1", keyId: key.keyId, keyPurpose: "settings_signing", keyVersion: 1,
      signatureAlgorithm: "Ed25519", signerType: "tenant", status: "active", structureVersion: "1"
    });
    expect(envelope.envelopeId).toMatch(/^env_[a-f0-9]{64}$/);
    const result = await verify(envelope, key);
    expect(result.valid).toBe(true);
    expect(result.reasonCodes).toEqual(["verified"]);
    expect(Object.values(result.components).every(Boolean)).toBe(true);
  });

  it("detects payload substitution, metadata substitution, stripping, and malformed signatures without throwing", async () => {
    const { envelope, key } = await builtEnvelope();
    const payload = await verify({ ...envelope, payload: { enabled: false } }, key);
    expect(payload.reasonCodes).toEqual(expect.arrayContaining(["digest_mismatch", "signature_invalid"]));
    const metadata = await verify({ ...envelope, signerId: "attacker" }, key);
    expect(metadata.reasonCodes).toContain("signed_metadata_mismatch");
    const stripped = { ...envelope } as Partial<CryptographicEnvelope>;
    delete (stripped as { artifactVersion?: string }).artifactVersion;
    expect((await verify(stripped, key)).reasonCodes).toContain("malformed_envelope");
    expect((await verify({ ...envelope, signature: "***" }, key)).reasonCodes).toContain("malformed_signature");
    const hostile = Object.defineProperty({}, "envelopeVersion", { get() { throw new Error("hostile getter"); } });
    await expect(verify(hostile, key)).resolves.toMatchObject({ valid: false });
  });

  it.each([
    ["tenantId", "tenant-2"], ["cardId", "card-2"], ["artifactType", "other"],
    ["artifactId", "other"], ["artifactVersion", "8"], ["domain", "brand.tokens.snapshot"],
    ["schemaVersion", "other"], ["digestAlgorithm", "SHA-512/256"], ["keyId", "other"],
    ["keyVersion", 2], ["signerType", "platform"], ["signerId", "other"],
    ["signedAt", "2026-07-17T09:00:00.000Z"], ["expiresAt", null],
    ["previousEnvelopeId", "env_fake"], ["previousDigest", "0".repeat(64)],
    ["provenanceManifestId", "prov_fake"], ["status", "superseded"]
  ] as const)("rejects signed critical-field substitution: %s", async (field, value) => {
    const { envelope, key } = await builtEnvelope();
    expect((await verify({ ...envelope, [field]: value }, key)).valid).toBe(false);
  });

  it("returns every expected tenant/card/artifact mismatch reason", async () => {
    const { envelope, key } = await builtEnvelope();
    const result = await verify(envelope, key, { expected: { artifactId: "wrong", artifactType: "wrong", artifactVersion: "wrong", cardId: "wrong", tenantId: "wrong" } });
    expect(result.reasonCodes).toEqual(expect.arrayContaining(["tenant_mismatch", "card_mismatch", "artifact_type_mismatch", "artifact_id_mismatch", "artifact_version_mismatch"]));
  });

  it("distinguishes unsupported versions and algorithm failures", async () => {
    const { envelope, key } = await builtEnvelope();
    expect((await verify({ ...envelope, envelopeVersion: "2" }, key)).reasonCodes).toContain("unsupported_envelope_version");
    expect((await verify({ ...envelope, canonicalizationVersion: "unknown" }, key)).reasonCodes).toContain("unsupported_canonicalization_version");
    expect((await verify({ ...envelope, digestAlgorithm: "unknown" }, key)).reasonCodes).toContain("unknown_algorithm");
    expect((await verify({ ...envelope, digestAlgorithm: "MD5" }, key)).reasonCodes).toContain("disabled_algorithm");
    expect((await verify({ ...envelope, signatureAlgorithm: "ECDSA-P256-SHA256" }, key)).reasonCodes).toContain("algorithm_context_invalid");
  });

  it("distinguishes unknown key, wrong version/purpose, retired policy, revocation, and compromise", async () => {
    const { envelope, key } = await builtEnvelope();
    expect((await verify(envelope, null)).reasonCodes).toContain("unknown_key");
    expect((await verify(envelope, { ...key, keyVersion: 2 })).reasonCodes).toContain("wrong_key_version");
    expect((await verify(envelope, { ...key, purpose: "tenant_artifact_signing" })).reasonCodes).toContain("wrong_key_purpose");
    const retired = { ...key, status: "retired" as const, statusChangedAt: "2026-07-17T10:30:00.000Z", validUntil: "2026-07-17T10:30:00.000Z" };
    expect((await verify(envelope, retired)).reasonCodes).toContain("key_retired_policy_denied");
    const allowed = await verifyCryptographicEnvelope({ allowRetiredHistorical: true, envelope, keyResolver: keyResolver(retired), verifiedAt });
    expect(allowed.valid).toBe(true);
    expect(allowed.warnings).toHaveLength(1);
    expect((await verify(envelope, { ...key, status: "revoked", revokedAt: verifiedAt })).reasonCodes).toContain("key_revoked");
    expect((await verify(envelope, { ...key, status: "compromised", compromisedAt: verifiedAt })).reasonCodes).toContain("key_compromised");
  });

  it("enforces expiration, correction linkage, provenance linkage, and required evidence", async () => {
    const { envelope: prior, key, provider } = await builtEnvelope();
    expect((await verify(prior, key, { verifiedAt: "2026-07-19T00:00:00.000Z" })).reasonCodes).toContain("envelope_expired");
    const corrected = await buildCryptographicEnvelope({ ...input(key, provider), artifactVersion: "8", previousDigest: prior.digest, previousEnvelopeId: prior.envelopeId });
    const priorResolver = { async resolvePriorEnvelope() { return prior; } };
    expect((await verify(corrected, key, { priorEnvelopeResolver: priorResolver })).valid).toBe(true);
    expect((await verify(corrected, key, { priorEnvelopeResolver: { async resolvePriorEnvelope() { return null; } } })).reasonCodes).toContain("broken_prior_linkage");
    expect((await verify(prior, key, { expected: { requirePreviousEnvelope: true } })).reasonCodes).toContain("missing_required_evidence");

    const manifest = createProvenanceManifest({ artifactDigest: prior.digest, artifactId: prior.artifactId, artifactType: prior.artifactType, artifactVersion: prior.artifactVersion, createdAt: signedAt, events: [], links: [], metadata: {}, schemaVersion: "provenance-1", tenantId: prior.tenantId });
    const withProvenance = await buildCryptographicEnvelope({ ...input(key, provider), provenanceManifestId: manifest.manifestId });
    const provenanceResolver = { async resolveProvenanceManifest() { return manifest; } };
    expect((await verify(withProvenance, key, { provenanceResolver })).valid).toBe(true);
    expect((await verify(withProvenance, key, { provenanceResolver: { async resolveProvenanceManifest() { return null; } } })).reasonCodes).toContain("invalid_provenance_linkage");
    expect((await verify(prior, key, { expected: { requireProvenanceManifest: true } })).reasonCodes).toContain("missing_required_evidence");
  });

  it("rejects unsafe metadata and incomplete correction links at build time", async () => {
    const { key, provider } = keyFixture();
    await expect(buildCryptographicEnvelope({ ...input(key, provider), metadata: { accessToken: "secret" } })).rejects.toThrow("sensitive metadata");
    await expect(buildCryptographicEnvelope({ ...input(key, provider), previousEnvelopeId: "env_previous" })).rejects.toThrow("both");
  });

  it("builds and verifies Communications domain evidence with tenant artifact signing", async () => {
    const { key, provider } = keyFixture("tenant_artifact_signing");
    const envelope = await buildCryptographicEnvelope({
      ...input(key, provider),
      artifactId: "communication-1",
      artifactType: "communication-webhook-evidence-v1",
      artifactVersion: "1",
      domain: "communications.webhook",
      expiresAt: null,
      payload: {
        payloadHash: "a".repeat(64),
        reasonCode: "WEBHOOK_VERIFIED"
      },
      schemaVersion: "communication-webhook-evidence-v1"
    });

    expect(envelope.domain).toBe("communications.webhook");
    expect(envelope.keyPurpose).toBe("tenant_artifact_signing");
    await expect(verify(envelope, key)).resolves.toMatchObject({
      reasonCodes: ["verified"],
      valid: true
    });
  });
});
