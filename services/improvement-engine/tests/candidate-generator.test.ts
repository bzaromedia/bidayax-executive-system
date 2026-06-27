import { describe, expect, it } from "vitest";
import { generateImprovementCandidate } from "../src/candidate-generator";
import type { ImprovementOpportunity } from "@bidayax/types";

const opportunity: ImprovementOpportunity = {
  baselineValue: 1200,
  evidenceSummary: "Average API latency is high.",
  opportunityType: "performance",
  reasonCodes: ["HIGH_API_LATENCY"],
  severity: "high",
  sourceMetric: "api_latency_ms",
  status: "detected",
  subsystem: "system"
};

describe("generateImprovementCandidate", () => {
  it("creates an explainable candidate from an opportunity", () => {
    const candidate = generateImprovementCandidate(opportunity);

    expect(candidate.title).toContain("system");
    expect(candidate.expectedMetric).toBe("api_latency_ms");
    expect(candidate.reasonCodes).toContain("HUMAN_APPROVAL_REQUIRED");
    expect(candidate.proposedChangeSummary).not.toContain("deploy");
  });
});
