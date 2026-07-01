export const opportunityStatus = {
  archived: "archived",
  candidateGenerated: "candidate_generated",
  detected: "detected",
  dismissed: "dismissed"
} as const;

export const candidateStatus = {
  approved: "approved",
  archived: "archived",
  needsReview: "needs_review",
  proposed: "proposed",
  rejected: "rejected",
  sandboxRequired: "sandbox_required"
} as const;

export const approvalStatus = {
  approved: "approved",
  blocked: "blocked",
  needsMoreEvidence: "needs_more_evidence",
  pending: "pending",
  rejected: "rejected"
} as const;

export const improvementApiErrorStatus = {
  invalidRequest: "invalid_request",
  notConfigured: "not_configured",
  safeFailure: "safe_failure"
} as const;

export type ImprovementApiErrorStatus =
  (typeof improvementApiErrorStatus)[keyof typeof improvementApiErrorStatus];

export type ImprovementApiErrorPayload = {
  readonly error: string;
  readonly status: ImprovementApiErrorStatus;
};

export function createSafeImprovementApiError(input: {
  readonly message: string;
  readonly status: ImprovementApiErrorStatus;
}): ImprovementApiErrorPayload {
  return {
    error: input.message,
    status: input.status
  };
}
