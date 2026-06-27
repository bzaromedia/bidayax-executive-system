import { describe, expect, it } from "vitest";
import { generateImprovementCandidate } from "../src/candidate-generator";
import {
  assertNoFakeOutcomeMetrics,
  createLineageEntry
} from "../src/lineage-archive";
import type { ImprovementOpportunity } from "@bidayax/types";

const opportunity: ImprovementOpportunity = {
  baselineValue: 4,
  evidenceSummary: "Errors exist.",
  opportunityType: "reliability",
  reasonCodes: ["HIGH_ERROR_RATE"],
  severity: "medium",
  sourceMetric: "telemetry_error_events",
  status: "detected",
  subsystem: "system"
};

describe("lineage archive", () => {
  it("creates lineage without fake after metrics or test results", () => {
    const candidate = generateImprovementCandidate(opportunity);
    const lineage = createLineageEntry({ candidate, opportunity });

    expect(lineage.metricsBefore.telemetry_error_events).toBe(4);
    expect(lineage.metricsAfter).toBeNull();
    expect(lineage.testResults).toBeNull();
    expect(lineage.benchmarkResults).toBeNull();
    expect(assertNoFakeOutcomeMetrics(lineage)).toBe(true);
  });
});
