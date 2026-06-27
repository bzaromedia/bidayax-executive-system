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
