import { describe, expect, it } from "vitest";
import type { DataTrustClaim, DataTrustEvidence } from "@bidayax/types";
import { assessDataTrust } from "../src/data-trust-assessment";

const evaluatedAt = "2026-07-01T00:00:00.000Z";

const evidence: readonly DataTrustEvidence[] = [
  {
    confidence: 0.96,
    id: "ev-source",
    observedAt: "2026-06-30T00:00:00.000Z",
    source: "interaction-ledger",
    summary: "Source record exists.",
    type: "source_record"
  },
  {
    confidence: 0.94,
    id: "ev-lineage",
    observedAt: "2026-06-30T00:00:00.000Z",
    source: "lineage-check",
    summary: "Lineage was validated.",
    type: "lineage"
  },
  {
    confidence: 0.98,
    id: "ev-approval",
    observedAt: "2026-06-30T00:00:00.000Z",
    source: "approval-log",
    summary: "Human approval was recorded.",
    type: "approval"
  }
];

const baseClaim: DataTrustClaim = {
  classification: "internal",
  claimType: "interaction",
  createdAt: "2026-06-30T00:00:00.000Z",
  evidenceIds: ["ev-source", "ev-lineage"],
  id: "claim-1",
  provenance: "interaction-ledger",
  subjectId: "session-1",
  subjectType: "interaction-session"
};

describe("assessDataTrust", () => {
  it("trusts a claim with strong linked evidence", () => {
    const result = assessDataTrust({
      claim: baseClaim,
      evaluatedAt,
      evidence
    });

    expect(result.decision).toBe("trusted");
    expect(result.tier).toBe("verified");
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasonCodes).toEqual([]);
  });

  it("blocks a revoked claim", () => {
    const result = assessDataTrust({
      claim: {
        ...baseClaim,
        revokedAt: "2026-06-30T12:00:00.000Z"
      },
      evaluatedAt,
      evidence
    });

    expect(result.decision).toBe("revoked");
    expect(result.score).toBe(0);
    expect(result.reasonCodes).toContain("CLAIM_REVOKED");
  });

  it("requires approval evidence for restricted claims", () => {
    const result = assessDataTrust({
      claim: {
        ...baseClaim,
        classification: "restricted",
        evidenceIds: ["ev-source", "ev-lineage"]
      },
      evaluatedAt,
      evidence
    });

    expect(result.decision).toBe("needs_review");
    expect(result.reasonCodes).toContain(
      "RESTRICTED_DATA_REQUIRES_APPROVAL_EVIDENCE"
    );
  });

  it("records missing linked evidence", () => {
    const result = assessDataTrust({
      claim: {
        ...baseClaim,
        evidenceIds: ["ev-source", "ev-missing"]
      },
      evaluatedAt,
      evidence
    });

    expect(result.missingEvidenceIds).toEqual(["ev-missing"]);
    expect(result.reasonCodes).toContain("MISSING_LINKED_EVIDENCE");
  });
});
