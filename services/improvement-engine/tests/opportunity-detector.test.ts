import { describe, expect, it } from "vitest";
import { detectImprovementOpportunities } from "../src/opportunity-detector";

describe("detectImprovementOpportunities", () => {
  it("detects performance opportunities from telemetry", () => {
    const opportunities = detectImprovementOpportunities({
      apiRequestCount: 12,
      averageApiLatencyMs: 1100
    });

    expect(opportunities[0]?.opportunityType).toBe("performance");
    expect(opportunities[0]?.reasonCodes).toContain("HIGH_API_LATENCY");
  });

  it("does not create opportunities without telemetry evidence", () => {
    const opportunities = detectImprovementOpportunities({
      apiRequestCount: 2,
      averageApiLatencyMs: 200,
      errorCount: 1,
      safetyGateBlockCount: 1
    });

    expect(opportunities).toHaveLength(0);
  });
});
