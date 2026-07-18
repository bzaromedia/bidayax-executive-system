import { canonicalize, CANONICALIZATION_VERSION, type CanonicalValue } from "./canonicalization";
import { sha256Bytes } from "./hashing";
import { ALGORITHM_POLICY_VERSION, enforceAlgorithmPolicy } from "./policy";
import type { HexDigest } from "./types";

export const securityDomains = [
  "settings.snapshot",
  "brand.tokens.snapshot",
  "identity.audit",
  "identity.session",
  "identity.authorization",
  "telephony.audit",
  "telephony.usage",
  "telephony.safety",
  "receptionist.runtime",
  "receptionist.consent",
  "receptionist.retention",
  "receptionist.redaction",
  "receptionist.safety",
  "receptionist.tool_authorization",
  "governance.legal_hold",
  "governance.erasure_receipt",
  "governance.kill_switch",
  "capital.document",
  "capital.disclosure",
  "capital.consent",
  "provenance.manifest",
  "watermark.asset",
  "watermark.package",
  "sentinelq.evidence"
] as const;

export type SecurityDomain = (typeof securityDomains)[number];

export type DomainDigestInput = {
  readonly domain: SecurityDomain | string;
  readonly schemaVersion: string;
  readonly canonicalizationVersion?: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly artifactType: string;
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly payload: CanonicalValue;
};

export class SecurityDomainError extends Error {
  constructor(readonly code: "unregistered-domain", message: string) {
    super(message);
    this.name = "SecurityDomainError";
  }
}

export function isSecurityDomain(value: string): value is SecurityDomain {
  return (securityDomains as readonly string[]).includes(value);
}

export function createDomainDigest(input: DomainDigestInput): HexDigest {
  if (!isSecurityDomain(input.domain)) {
    throw new SecurityDomainError("unregistered-domain", `Unregistered security domain: ${input.domain}`);
  }
  enforceAlgorithmPolicy({
    algorithm: "SHA-256",
    context: "artifact-digest",
    operation: "digest",
    policyVersion: ALGORITHM_POLICY_VERSION
  });
  const canonicalizationVersion = input.canonicalizationVersion ?? CANONICALIZATION_VERSION;
  const canonical = canonicalize({
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    artifactVersion: input.artifactVersion,
    canonicalizationVersion,
    cardId: input.cardId,
    domain: input.domain,
    payload: input.payload,
    schemaVersion: input.schemaVersion,
    tenantId: input.tenantId
  }, { canonicalizationVersion, schemaVersion: "security-domain-binding-1" });
  return sha256Bytes(canonical.bytes);
}
