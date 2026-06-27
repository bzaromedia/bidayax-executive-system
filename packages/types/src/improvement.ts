export const improvementOpportunityTypes = [
  "performance",
  "accessibility",
  "reliability",
  "conversion",
  "safety_gate",
  "documentation",
  "design_system",
  "receptionist_workflow",
  "telephony_readiness",
  "dashboard_usage"
] as const;

export type ImprovementOpportunityType =
  (typeof improvementOpportunityTypes)[number];

export const improvementOpportunityStatuses = [
  "detected",
  "candidate_generated",
  "dismissed",
  "archived"
] as const;

export type ImprovementOpportunityStatus =
  (typeof improvementOpportunityStatuses)[number];

export const improvementSeverities = ["low", "medium", "high", "critical"] as const;

export type ImprovementSeverity = (typeof improvementSeverities)[number];

export const improvementCandidateStatuses = [
  "proposed",
  "needs_review",
  "approved",
  "rejected",
  "sandbox_required",
  "archived"
] as const;

export type ImprovementCandidateStatus =
  (typeof improvementCandidateStatuses)[number];

export const improvementApprovalStatuses = [
  "pending",
  "approved",
  "rejected",
  "needs_more_evidence",
  "blocked"
] as const;

export type ImprovementApprovalStatus =
  (typeof improvementApprovalStatuses)[number];

export const improvementApprovalDecisions = [
  "approved",
  "rejected",
  "needs_more_evidence",
  "blocked"
] as const;

export type ImprovementApprovalDecision =
  (typeof improvementApprovalDecisions)[number];

export const improvementReasonCodes = [
  "HIGH_API_LATENCY",
  "REPEATED_SAFETY_GATE_BLOCKS",
  "HIGH_ERROR_RATE",
  "LOW_CARD_ACTION_CONVERSION",
  "CONFIGURATION_MISUSE",
  "TELEMETRY_EVIDENCE_REQUIRED",
  "SANDBOX_REQUIRED",
  "HUMAN_APPROVAL_REQUIRED",
  "VOICE_OR_TELEPHONY_RISK",
  "DATABASE_RISK",
  "SECURITY_RISK",
  "ROLLBACK_REQUIRED",
  "NO_FAKE_METRICS_ALLOWED"
] as const;

export type ImprovementReasonCode = (typeof improvementReasonCodes)[number];

export type ImprovementSubsystem =
  | "card"
  | "dashboard"
  | "event_ledger"
  | "intent_scoring"
  | "contact_graph"
  | "receptionist"
  | "telephony"
  | "provider_readiness"
  | "system"
  | "database"
  | "security"
  | "design_system"
  | "documentation";

export type ImprovementOpportunity = {
  readonly id?: string;
  readonly subsystem: ImprovementSubsystem;
  readonly opportunityType: ImprovementOpportunityType;
  readonly evidenceSummary: string;
  readonly sourceMetric: string;
  readonly baselineValue: number;
  readonly severity: ImprovementSeverity;
  readonly status: ImprovementOpportunityStatus;
  readonly reasonCodes: readonly ImprovementReasonCode[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ImprovementScoreComponents = {
  readonly evidenceScore: number;
  readonly expectedImpact: number;
  readonly userValue: number;
  readonly maintainabilityGain: number;
  readonly performanceGain: number;
  readonly accessibilityGain: number;
  readonly implementationRisk: number;
  readonly regressionRisk: number;
  readonly complexityCost: number;
};

export type ImprovementRiskFactors = {
  readonly productionImpact: number;
  readonly safetyGateInvolvement: number;
  readonly databaseImpact: number;
  readonly voiceOrTelephonyImpact: number;
  readonly securityImpact: number;
  readonly rollbackDifficulty: number;
  readonly testCoverageRequirement: number;
};

export type ImprovementCandidate = {
  readonly id?: string;
  readonly opportunityId?: string | null;
  readonly title: string;
  readonly hypothesis: string;
  readonly targetSubsystem: ImprovementSubsystem;
  readonly proposedChangeSummary: string;
  readonly expectedMetric: string;
  readonly expectedImpact: number;
  readonly riskScore: number;
  readonly evidenceScore: number;
  readonly complexityScore: number;
  readonly priorityScore: number;
  readonly scoreComponents: ImprovementScoreComponents;
  readonly reasonCodes: readonly ImprovementReasonCode[];
  readonly status: ImprovementCandidateStatus;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ImprovementLineageEntry = {
  readonly id?: string;
  readonly candidateId?: string | null;
  readonly parentCandidateId: string | null;
  readonly variantId: string;
  readonly targetArea: ImprovementSubsystem;
  readonly hypothesis: string;
  readonly designDiffSummary: string | null;
  readonly codeDiffSummary: string | null;
  readonly metricsBefore: Readonly<Record<string, unknown>>;
  readonly metricsAfter: null;
  readonly testResults: null;
  readonly benchmarkResults: null;
  readonly reviewNotes: string | null;
  readonly riskScore: number;
  readonly approvalStatus: ImprovementApprovalStatus;
  readonly rollbackPlan: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ImprovementApprovalEvent = {
  readonly id?: string;
  readonly candidateId: string;
  readonly decision: ImprovementApprovalDecision;
  readonly decidedBy: string;
  readonly decisionNotes: string;
  readonly createdAt?: string;
};

export type ImprovementEngineSummary = {
  readonly opportunityCount: number;
  readonly candidateCount: number;
  readonly pendingApprovalCount: number;
  readonly approvedCount: number;
  readonly rejectedCount: number;
  readonly archivedLineageCount: number;
  readonly averageEvidenceScore: number;
  readonly averageRiskScore: number;
};

export function isImprovementOpportunityType(
  value: string
): value is ImprovementOpportunityType {
  return (improvementOpportunityTypes as readonly string[]).includes(value);
}

export function isImprovementCandidateStatus(
  value: string
): value is ImprovementCandidateStatus {
  return (improvementCandidateStatuses as readonly string[]).includes(value);
}

export function isImprovementApprovalDecision(
  value: string
): value is ImprovementApprovalDecision {
  return (improvementApprovalDecisions as readonly string[]).includes(value);
}
