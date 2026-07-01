export const dataClassifications = [
  "public",
  "internal",
  "confidential",
  "restricted"
] as const;

export type DataClassification = (typeof dataClassifications)[number];

export const dataTrustEvidenceTypes = [
  "source_record",
  "lineage",
  "provenance",
  "verification",
  "approval",
  "revocation"
] as const;

export type DataTrustEvidenceType = (typeof dataTrustEvidenceTypes)[number];

export const dataTrustClaimTypes = [
  "identity",
  "interaction",
  "consent",
  "authority",
  "financial",
  "intellectual_property",
  "policy"
] as const;

export type DataTrustClaimType = (typeof dataTrustClaimTypes)[number];

export const dataTrustAssessmentTiers = [
  "verified",
  "supported",
  "weak",
  "untrusted"
] as const;

export type DataTrustAssessmentTier =
  (typeof dataTrustAssessmentTiers)[number];

export const dataTrustAssessmentDecisions = [
  "trusted",
  "needs_review",
  "blocked",
  "revoked"
] as const;

export type DataTrustAssessmentDecision =
  (typeof dataTrustAssessmentDecisions)[number];

export type DataTrustEvidence = {
  readonly id: string;
  readonly type: DataTrustEvidenceType;
  readonly source: string;
  readonly observedAt: string;
  readonly confidence: number;
  readonly summary: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type DataTrustClaim = {
  readonly id: string;
  readonly subjectId: string;
  readonly subjectType: string;
  readonly claimType: DataTrustClaimType;
  readonly classification: DataClassification;
  readonly provenance: string;
  readonly evidenceIds: readonly string[];
  readonly createdAt: string;
  readonly expiresAt?: string | null;
  readonly revokedAt?: string | null;
};

export type DataTrustAssessmentInput = {
  readonly claim: DataTrustClaim;
  readonly evidence: readonly DataTrustEvidence[];
  readonly evaluatedAt?: string | null;
};

export type DataTrustAssessment = {
  readonly claimId: string;
  readonly classification: DataClassification;
  readonly decision: DataTrustAssessmentDecision;
  readonly evidenceCount: number;
  readonly evaluatedAt: string;
  readonly explanation: readonly string[];
  readonly missingEvidenceIds: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly score: number;
  readonly tier: DataTrustAssessmentTier;
};

export function isDataClassification(value: string): value is DataClassification {
  return (dataClassifications as readonly string[]).includes(value);
}

export function isDataTrustEvidenceType(
  value: string
): value is DataTrustEvidenceType {
  return (dataTrustEvidenceTypes as readonly string[]).includes(value);
}
