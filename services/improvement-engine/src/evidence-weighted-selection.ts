import type { ImprovementScoreComponents } from "@bidayax/types";

export function calculatePriorityScore(components: ImprovementScoreComponents) {
  return Math.max(
    0,
    Math.round(
      components.evidenceScore +
        components.expectedImpact +
        components.userValue +
        components.maintainabilityGain +
        components.performanceGain +
        components.accessibilityGain -
        components.implementationRisk -
        components.regressionRisk -
        components.complexityCost
    )
  );
}

export function createScoreComponents(
  components: Partial<ImprovementScoreComponents>
): ImprovementScoreComponents {
  return {
    accessibilityGain: components.accessibilityGain ?? 0,
    complexityCost: components.complexityCost ?? 3,
    evidenceScore: components.evidenceScore ?? 0,
    expectedImpact: components.expectedImpact ?? 0,
    implementationRisk: components.implementationRisk ?? 5,
    maintainabilityGain: components.maintainabilityGain ?? 0,
    performanceGain: components.performanceGain ?? 0,
    regressionRisk: components.regressionRisk ?? 3,
    userValue: components.userValue ?? 0
  };
}
