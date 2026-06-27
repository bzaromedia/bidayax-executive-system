import type {
  ImprovementOpportunity,
  ImprovementRiskFactors,
  ImprovementSubsystem
} from "@bidayax/types";

const subsystemRisk: Record<ImprovementSubsystem, number> = {
  card: 3,
  contact_graph: 5,
  dashboard: 3,
  database: 8,
  design_system: 4,
  documentation: 1,
  event_ledger: 6,
  intent_scoring: 5,
  provider_readiness: 7,
  receptionist: 6,
  security: 9,
  system: 6,
  telephony: 9
};

export function calculateRiskScore(factors: ImprovementRiskFactors) {
  const total =
    factors.productionImpact +
    factors.safetyGateInvolvement +
    factors.databaseImpact +
    factors.voiceOrTelephonyImpact +
    factors.securityImpact +
    factors.rollbackDifficulty +
    factors.testCoverageRequirement;

  return Math.min(100, Math.max(0, Math.round(total)));
}

export function riskFactorsFromOpportunity(
  opportunity: ImprovementOpportunity
): ImprovementRiskFactors {
  const targetRisk = subsystemRisk[opportunity.subsystem];
  const isVoiceOrTelephony =
    opportunity.subsystem === "telephony" ||
    opportunity.subsystem === "provider_readiness" ||
    opportunity.opportunityType === "telephony_readiness";
  const touchesSafetyGate =
    opportunity.opportunityType === "safety_gate" ||
    opportunity.subsystem === "security" ||
    opportunity.subsystem === "provider_readiness";
  const touchesDatabase =
    opportunity.subsystem === "database" ||
    opportunity.subsystem === "event_ledger" ||
    opportunity.subsystem === "contact_graph";

  return {
    databaseImpact: touchesDatabase ? 10 : 2,
    productionImpact: targetRisk,
    rollbackDifficulty: isVoiceOrTelephony ? 9 : Math.max(2, targetRisk - 1),
    safetyGateInvolvement: touchesSafetyGate ? 12 : 1,
    securityImpact: opportunity.subsystem === "security" ? 14 : 2,
    testCoverageRequirement: isVoiceOrTelephony ? 12 : 5,
    voiceOrTelephonyImpact: isVoiceOrTelephony ? 16 : 0
  };
}

export function riskScoreFromOpportunity(opportunity: ImprovementOpportunity) {
  return calculateRiskScore(riskFactorsFromOpportunity(opportunity));
}
