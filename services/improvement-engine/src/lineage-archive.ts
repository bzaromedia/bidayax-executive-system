import type {
  ImprovementCandidate,
  ImprovementLineageEntry,
  ImprovementOpportunity
} from "@bidayax/types";

export function createLineageEntry(input: {
  readonly candidate: ImprovementCandidate;
  readonly opportunity?: ImprovementOpportunity | null;
  readonly parentCandidateId?: string | null;
}): ImprovementLineageEntry {
  const metricName = input.opportunity?.sourceMetric ?? input.candidate.expectedMetric;
  const baselineValue = input.opportunity?.baselineValue ?? null;

  return {
    approvalStatus: "pending",
    benchmarkResults: null,
    candidateId: input.candidate.id ?? null,
    codeDiffSummary: null,
    designDiffSummary: null,
    hypothesis: input.candidate.hypothesis,
    metricsAfter: null,
    metricsBefore: {
      [metricName]: baselineValue,
      source: "telemetry"
    },
    parentCandidateId: input.parentCandidateId ?? null,
    reviewNotes: "Awaiting human review. Phase 13 does not implement this candidate.",
    riskScore: input.candidate.riskScore,
    rollbackPlan:
      "Any future implementation must be sandbox-tested and reversible before production promotion.",
    targetArea: input.candidate.targetSubsystem,
    testResults: null,
    variantId: createVariantId(input.candidate)
  };
}

export function createVariantId(candidate: ImprovementCandidate) {
  const slug = candidate.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `phase13-${slug || "candidate"}`;
}

export function assertNoFakeOutcomeMetrics(entry: ImprovementLineageEntry) {
  return (
    entry.metricsAfter === null &&
    entry.testResults === null &&
    entry.benchmarkResults === null
  );
}
