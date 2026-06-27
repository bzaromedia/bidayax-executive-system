import { describe, expect, it } from "vitest";
import {
  calculatePriorityScore,
  createScoreComponents
} from "../src/evidence-weighted-selection";

describe("evidence weighted selection", () => {
  it("calculates deterministic priority scores", () => {
    const components = createScoreComponents({
      complexityCost: 6,
      evidenceScore: 40,
      expectedImpact: 20,
      implementationRisk: 5,
      maintainabilityGain: 6,
      regressionRisk: 4,
      userValue: 8
    });

    expect(calculatePriorityScore(components)).toBe(59);
    expect(calculatePriorityScore(components)).toBe(59);
  });
});
