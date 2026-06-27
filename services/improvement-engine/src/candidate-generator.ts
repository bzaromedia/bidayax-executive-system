import type {
  ImprovementCandidate,
  ImprovementOpportunity,
  ImprovementReasonCode
} from "@bidayax/types";
import {
  calculatePriorityScore,
  createScoreComponents
} from "./evidence-weighted-selection";
import { improvementReasonCodes } from "./improvement-reason-codes";
import { riskScoreFromOpportunity } from "./risk-scoring";

function titleFor(opportunity: ImprovementOpportunity) {
  const label = opportunity.opportunityType.replaceAll("_", " ");

  return `Review ${opportunity.subsystem} ${label} opportunity`;
}

function expectedMetricFor(opportunity: ImprovementOpportunity) {
  if (opportunity.opportunityType === "performance") {
    return "api_latency_ms";
  }

  if (opportunity.opportunityType === "conversion") {
    return "card_action_conversion";
  }

  if (opportunity.opportunityType === "safety_gate") {
    return "safety_gate_blocks";
  }

  if (opportunity.opportunityType === "documentation") {
    return "configuration_error_count";
  }

  return opportunity.sourceMetric;
}

function expectedImpactFor(opportunity: ImprovementOpportunity) {
  if (opportunity.severity === "critical") {
    return 35;
  }

  if (opportunity.severity === "high") {
    return 28;
  }

  if (opportunity.severity === "medium") {
    return 18;
  }

  return 8;
}

function evidenceScoreFor(opportunity: ImprovementOpportunity) {
  const valueWeight = Math.min(35, Math.round(opportunity.baselineValue));
  const severityWeight =
    opportunity.severity === "high" || opportunity.severity === "critical"
      ? 18
      : opportunity.severity === "medium"
        ? 10
        : 4;

  return Math.min(100, valueWeight + severityWeight + 20);
}

function proposedChangeFor(opportunity: ImprovementOpportunity) {
  switch (opportunity.opportunityType) {
    case "performance":
      return "Investigate slow request paths, add focused timing telemetry, and propose a sandboxed performance fix before implementation.";
    case "conversion":
      return "Review card action affordances and propose a sandbox-tested interaction improvement without changing production UI automatically.";
    case "safety_gate":
      return "Analyze blocked safety gate reason codes and propose clearer configuration or approval workflow guidance without weakening gates.";
    case "documentation":
      return "Clarify setup documentation and readiness guidance where telemetry shows repeated configuration misuse.";
    case "telephony_readiness":
      return "Improve telephony readiness guidance and blocked-state explanation while keeping live provider activation disabled.";
    default:
      return "Create a scoped improvement proposal backed by telemetry, tests, rollback requirements, and human review.";
  }
}

function reasonCodesFor(
  opportunity: ImprovementOpportunity,
  riskScore: number
): readonly ImprovementReasonCode[] {
  const reasons = new Set<ImprovementReasonCode>([
    ...opportunity.reasonCodes,
    improvementReasonCodes.humanApprovalRequired,
    improvementReasonCodes.sandboxRequired,
    improvementReasonCodes.rollbackRequired,
    improvementReasonCodes.noFakeMetricsAllowed
  ]);

  if (riskScore >= 50) {
    reasons.add(improvementReasonCodes.telemetryEvidenceRequired);
  }

  if (
    opportunity.subsystem === "telephony" ||
    opportunity.opportunityType === "telephony_readiness"
  ) {
    reasons.add(improvementReasonCodes.voiceOrTelephonyRisk);
  }

  if (opportunity.subsystem === "database") {
    reasons.add(improvementReasonCodes.databaseRisk);
  }

  if (opportunity.subsystem === "security") {
    reasons.add(improvementReasonCodes.securityRisk);
  }

  return Array.from(reasons);
}

export function generateImprovementCandidate(
  opportunity: ImprovementOpportunity
): ImprovementCandidate {
  const riskScore = riskScoreFromOpportunity(opportunity);
  const expectedImpact = expectedImpactFor(opportunity);
  const evidenceScore = evidenceScoreFor(opportunity);
  const complexityScore = Math.min(30, Math.round(riskScore / 3));
  const scoreComponents = createScoreComponents({
    accessibilityGain: opportunity.opportunityType === "accessibility" ? 10 : 0,
    complexityCost: complexityScore,
    evidenceScore,
    expectedImpact,
    implementationRisk: Math.round(riskScore / 4),
    maintainabilityGain:
      opportunity.opportunityType === "documentation" ||
      opportunity.opportunityType === "reliability"
        ? 10
        : 4,
    performanceGain: opportunity.opportunityType === "performance" ? 14 : 0,
    regressionRisk: Math.round(riskScore / 5),
    userValue:
      opportunity.opportunityType === "conversion" ||
      opportunity.opportunityType === "receptionist_workflow"
        ? 12
        : 6
  });

  return {
    complexityScore,
    evidenceScore,
    expectedImpact,
    expectedMetric: expectedMetricFor(opportunity),
    hypothesis: `If BidayaX addresses the ${opportunity.sourceMetric} evidence for ${opportunity.subsystem}, the system should improve the tracked metric without bypassing safety gates.`,
    opportunityId: opportunity.id ?? null,
    priorityScore: calculatePriorityScore(scoreComponents),
    proposedChangeSummary: proposedChangeFor(opportunity),
    reasonCodes: reasonCodesFor(opportunity, riskScore),
    riskScore,
    scoreComponents,
    status: riskScore >= 45 ? "sandbox_required" : "needs_review",
    targetSubsystem: opportunity.subsystem,
    title: titleFor(opportunity)
  };
}

export function generateImprovementCandidates(
  opportunities: readonly ImprovementOpportunity[]
): readonly ImprovementCandidate[] {
  return opportunities.map(generateImprovementCandidate);
}
