import { canonicalUtcTimestamp, type CanonicalValue } from "./canonicalization";
import { internalDigest } from "./hashing";
import type { SafeMetadata } from "./types";
import { assertSafeEvidenceAttributes } from "./validation";
import { buildCryptographicEnvelope } from "./envelope";
import type { SecurityDomain } from "./domains";
import type { SignatureProvider } from "./providers";
import type { CryptographicEnvelope, TrustKey } from "./types";

export type EvidenceFamily = "identity" | "telephony" | "receptionist";
export type SanitizedEvidence = {
  readonly structureVersion: "1";
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly family: EvidenceFamily;
  readonly eventType: string;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly subjectId: string;
  readonly outcome: "accepted" | "denied" | "failed" | "recorded";
  readonly reasonCode: string;
  readonly attributes: SafeMetadata;
};


const identityEvents = new Set([
  "identity.created", "identity.provider_linked", "identity.membership_changed",
  "identity.card_grant_changed", "identity.account_disabled", "identity.session_revoked",
  "identity.authorization_changed", "identity.security_webhook_result"
]);
const telephonyEvents = new Set([
  "telephony.command_accepted", "telephony.command_denied", "telephony.state_transition",
  "telephony.routing_decision", "telephony.provider_event_normalized", "telephony.usage_recorded",
  "telephony.safety_decision"
]);
const receptionistEvents = new Set([
  "receptionist.consent", "receptionist.retention", "receptionist.redaction",
  "receptionist.safety", "receptionist.tool_authorization", "receptionist.escalation",
  "receptionist.language_policy", "receptionist.runtime_policy"
]);

function allowedEvent(family: EvidenceFamily, eventType: string): boolean {
  return (family === "identity" ? identityEvents : family === "telephony" ? telephonyEvents : receptionistEvents).has(eventType);
}

export function createSanitizedEvidence(input: Omit<SanitizedEvidence, "structureVersion" | "eventId" | "occurredAt"> & { readonly occurredAt: string }): SanitizedEvidence {
  if (!allowedEvent(input.family, input.eventType)) throw new Error(`Unsupported ${input.family} evidence event`);
  if (!input.tenantId || !input.subjectId || !input.reasonCode) throw new Error("Evidence identity fields are required");
  assertSafeEvidenceAttributes(input.attributes);
  const occurredAt = canonicalUtcTimestamp(input.occurredAt);
  const base = { ...input, occurredAt, structureVersion: "1" as const };
  const eventId = `evidence_${internalDigest(`trust-${input.family}-evidence/v1`, `${input.family}-evidence-1`, base)}`;
  return Object.freeze({ ...base, eventId });
}

export function evidencePayload(evidence: SanitizedEvidence): CanonicalValue {
  return evidence as unknown as CanonicalValue;
}

export async function buildSignedSanitizedEvidence(input: { readonly evidence: SanitizedEvidence; readonly domain: SecurityDomain; readonly key: TrustKey; readonly provider: SignatureProvider; readonly signerId: string; readonly signerType: "platform" | "tenant" | "agent" | "system" }): Promise<CryptographicEnvelope> {
  if (input.key.identityId !== input.signerId) throw new Error("Evidence signer identity mismatch");
  return buildCryptographicEnvelope({ artifactId: input.evidence.eventId, artifactType: `${input.evidence.family}_security_evidence`, artifactVersion: "1", cardId: input.evidence.cardId, domain: input.domain, expiresAt: null, key: input.key, metadata: { evidenceFamily: input.evidence.family, reasonCode: input.evidence.reasonCode }, payload: evidencePayload(input.evidence), previousDigest: null, previousEnvelopeId: null, provenanceManifestId: null, provider: input.provider, schemaVersion: `${input.evidence.family}-security-evidence-1`, signedAt: input.evidence.occurredAt, signerId: input.signerId, signerType: input.signerType, status: "active", tenantId: input.evidence.tenantId });
}
