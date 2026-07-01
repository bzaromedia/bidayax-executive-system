import type {
  DataClassification,
  DataTrustAssessment,
  DataTrustAssessmentDecision,
  DataTrustAssessmentInput,
  DataTrustAssessmentTier,
  DataTrustEvidence,
  DataTrustEvidenceType
} from "@bidayax/types";

const classificationPenalties: Record<DataClassification, number> = {
  confidential: 10,
  internal: 5,
  public: 0,
  restricted: 20
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isBeforeOrEqual(value: string | null | undefined, reference: string) {
  if (!value) {
    return false;
  }

  return Date.parse(value) <= Date.parse(reference);
}

function uniqueEvidenceTypes(
  evidence: readonly DataTrustEvidence[]
): readonly DataTrustEvidenceType[] {
  return Array.from(new Set(evidence.map((item) => item.type))).sort();
}

function tierForScore(score: number): DataTrustAssessmentTier {
  if (score >= 85) {
    return "verified";
  }

  if (score >= 65) {
    return "supported";
  }

  if (score >= 40) {
    return "weak";
  }

  return "untrusted";
}

function decisionForScore(
  score: number,
  reasonCodes: readonly string[]
): DataTrustAssessmentDecision {
  if (reasonCodes.includes("CLAIM_REVOKED")) {
    return "revoked";
  }

  if (reasonCodes.includes("CLAIM_EXPIRED") || score < 40) {
    return "blocked";
  }

  if (
    reasonCodes.includes("MISSING_LINKED_EVIDENCE") ||
    reasonCodes.includes("RESTRICTED_DATA_REQUIRES_APPROVAL_EVIDENCE") ||
    reasonCodes.includes("LINEAGE_EVIDENCE_MISSING")
  ) {
    return "needs_review";
  }

  if (score < 65) {
    return "needs_review";
  }

  return "trusted";
}

export function assessDataTrust(
  input: DataTrustAssessmentInput
): DataTrustAssessment {
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const evidenceById = new Map(
    input.evidence.map((evidence) => [evidence.id, evidence])
  );
  const supportingEvidence = input.claim.evidenceIds
    .map((evidenceId) => evidenceById.get(evidenceId))
    .filter((evidence): evidence is DataTrustEvidence => Boolean(evidence));
  const missingEvidenceIds = input.claim.evidenceIds.filter(
    (evidenceId) => !evidenceById.has(evidenceId)
  );
  const evidenceTypes = uniqueEvidenceTypes(supportingEvidence);
  const reasonCodes = new Set<string>();
  const explanation: string[] = [];

  if (supportingEvidence.length === 0) {
    reasonCodes.add("NO_SUPPORTING_EVIDENCE");
    explanation.push("The claim has no available supporting evidence.");
  }

  if (missingEvidenceIds.length > 0) {
    reasonCodes.add("MISSING_LINKED_EVIDENCE");
    explanation.push("One or more linked evidence records are unavailable.");
  }

  if (isBeforeOrEqual(input.claim.expiresAt, evaluatedAt)) {
    reasonCodes.add("CLAIM_EXPIRED");
    explanation.push("The claim expired before or at the evaluation time.");
  }

  if (isBeforeOrEqual(input.claim.revokedAt, evaluatedAt)) {
    reasonCodes.add("CLAIM_REVOKED");
    explanation.push("The claim was revoked before or at the evaluation time.");
  }

  if (
    input.claim.classification === "restricted" &&
    !evidenceTypes.includes("approval")
  ) {
    reasonCodes.add("RESTRICTED_DATA_REQUIRES_APPROVAL_EVIDENCE");
    explanation.push("Restricted claims require approval evidence.");
  }

  if (!evidenceTypes.includes("lineage")) {
    reasonCodes.add("LINEAGE_EVIDENCE_MISSING");
    explanation.push("Lineage evidence is not present.");
  }

  const confidenceAverage =
    supportingEvidence.length === 0
      ? 0
      : supportingEvidence.reduce(
          (total, evidence) => total + Math.max(0, Math.min(1, evidence.confidence)),
          0
        ) / supportingEvidence.length;
  const diversityBonus = Math.min(15, evidenceTypes.length * 5);
  const missingPenalty = missingEvidenceIds.length * 10;
  const classificationPenalty = classificationPenalties[input.claim.classification];
  const score = reasonCodes.has("CLAIM_REVOKED")
    ? 0
    : clampScore(
        confidenceAverage * 100 +
          diversityBonus -
          missingPenalty -
          classificationPenalty
      );
  const decision = decisionForScore(score, Array.from(reasonCodes));

  if (explanation.length === 0) {
    explanation.push("The claim is supported by the linked evidence.");
  }

  return {
    claimId: input.claim.id,
    classification: input.claim.classification,
    decision,
    evidenceCount: supportingEvidence.length,
    evaluatedAt,
    explanation,
    missingEvidenceIds,
    reasonCodes: Array.from(reasonCodes).sort(),
    score,
    tier: tierForScore(score)
  };
}
