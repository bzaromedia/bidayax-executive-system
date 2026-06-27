import { describe, expect, it } from "vitest";
import {
  canMarkCandidateApproved,
  createApprovalEvent,
  evaluateApprovalGate
} from "../src/approval-gate";
import type { ImprovementCandidate } from "@bidayax/types";

const candidate: ImprovementCandidate = {
  complexityScore: 5,
  evidenceScore: 30,
  expectedImpact: 20,
  expectedMetric: "api_latency_ms",
  hypothesis: "Improve the measured path.",
  id: "candidate-1",
  opportunityId: "opportunity-1",
  priorityScore: 30,
  proposedChangeSummary: "Review in sandbox.",
  reasonCodes: ["HUMAN_APPROVAL_REQUIRED"],
  riskScore: 20,
  scoreComponents: {
    accessibilityGain: 0,
    complexityCost: 5,
    evidenceScore: 30,
    expectedImpact: 20,
    implementationRisk: 5,
    maintainabilityGain: 5,
    performanceGain: 5,
    regressionRisk: 5,
    userValue: 5
  },
  status: "needs_review",
  targetSubsystem: "system",
  title: "Review system performance"
};

describe("approval gate", () => {
  it("requires approval before approved state", () => {
    expect(canMarkCandidateApproved({ approvalEvents: [], candidate })).toBe(false);
    expect(evaluateApprovalGate({ approvalEvents: [], candidate }).reasonCodes).toContain(
      "HUMAN_APPROVAL_REQUIRED"
    );
  });

  it("allows approved state only when an approval event exists", () => {
    const approval = createApprovalEvent({
      candidateId: "candidate-1",
      decidedBy: "human-reviewer",
      decision: "approved",
      decisionNotes: "Approved for future sandbox evaluation only."
    });

    expect(canMarkCandidateApproved({ approvalEvents: [approval], candidate })).toBe(
      true
    );
  });

  it("keeps rejected candidates archived for review", () => {
    const rejection = createApprovalEvent({
      candidateId: "candidate-1",
      decidedBy: "human-reviewer",
      decision: "rejected",
      decisionNotes: "Not enough evidence."
    });

    expect(evaluateApprovalGate({ approvalEvents: [rejection], candidate })).toEqual({
      allowedStatus: "rejected",
      approvalRequired: false,
      reasonCodes: ["CANDIDATE_REJECTED_ARCHIVE_REQUIRED"]
    });
  });
});
