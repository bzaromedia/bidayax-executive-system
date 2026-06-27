import type {
  ImprovementApprovalDecision,
  ImprovementApprovalEvent,
  ImprovementCandidate,
  ImprovementCandidateStatus
} from "@bidayax/types";

export type ApprovalGateResult = {
  readonly allowedStatus: ImprovementCandidateStatus;
  readonly approvalRequired: boolean;
  readonly reasonCodes: readonly string[];
};

export function createApprovalEvent(input: {
  readonly candidateId: string;
  readonly decision: ImprovementApprovalDecision;
  readonly decidedBy: string;
  readonly decisionNotes: string;
}): ImprovementApprovalEvent {
  return {
    candidateId: input.candidateId,
    createdAt: new Date().toISOString(),
    decidedBy: input.decidedBy,
    decision: input.decision,
    decisionNotes: input.decisionNotes
  };
}

export function evaluateApprovalGate(input: {
  readonly candidate: ImprovementCandidate;
  readonly approvalEvents: readonly ImprovementApprovalEvent[];
}): ApprovalGateResult {
  const approval = input.approvalEvents.find(
    (event) =>
      event.candidateId === input.candidate.id && event.decision === "approved"
  );
  const rejection = input.approvalEvents.find(
    (event) =>
      event.candidateId === input.candidate.id && event.decision === "rejected"
  );

  if (rejection) {
    return {
      allowedStatus: "rejected",
      approvalRequired: false,
      reasonCodes: ["CANDIDATE_REJECTED_ARCHIVE_REQUIRED"]
    };
  }

  if (!approval) {
    return {
      allowedStatus: "needs_review",
      approvalRequired: true,
      reasonCodes: ["HUMAN_APPROVAL_REQUIRED", "SANDBOX_REQUIRED"]
    };
  }

  return {
    allowedStatus: "approved",
    approvalRequired: false,
    reasonCodes: ["APPROVED_FOR_FUTURE_SANDBOX_IMPLEMENTATION"]
  };
}

export function canMarkCandidateApproved(input: {
  readonly candidate: ImprovementCandidate;
  readonly approvalEvents: readonly ImprovementApprovalEvent[];
}) {
  return evaluateApprovalGate(input).allowedStatus === "approved";
}
