import { describe, expect, it } from "vitest";
import { riskScoreFromOpportunity } from "../src/risk-scoring";
import type { ImprovementOpportunity } from "@bidayax/types";

describe("risk scoring", () => {
  it("elevates voice and telephony risk", () => {
    const telephonyOpportunity: ImprovementOpportunity = {
      baselineValue: 3,
      evidenceSummary: "Readiness failures exist.",
      opportunityType: "telephony_readiness",
      reasonCodes: ["VOICE_OR_TELEPHONY_RISK"],
      severity: "high",
      sourceMetric: "telephony_readiness_failures",
      status: "detected",
      subsystem: "telephony"
    };
    const documentationOpportunity: ImprovementOpportunity = {
      ...telephonyOpportunity,
      opportunityType: "documentation",
      subsystem: "documentation"
    };

    expect(riskScoreFromOpportunity(telephonyOpportunity)).toBeGreaterThan(
      riskScoreFromOpportunity(documentationOpportunity)
    );
  });
});
