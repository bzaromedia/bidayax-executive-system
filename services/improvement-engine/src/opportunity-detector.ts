import type {
  ImprovementOpportunity,
  ImprovementReasonCode,
  ImprovementSeverity,
  ImprovementSubsystem
} from "@bidayax/types";
import { improvementReasonCodes } from "./improvement-reason-codes";

export type TelemetryEvidenceSummary = {
  readonly averageApiLatencyMs: number;
  readonly apiRequestCount: number;
  readonly errorCount: number;
  readonly safetyGateBlockCount: number;
  readonly cardViewCount: number;
  readonly cardActionCount: number;
  readonly configurationErrorCount: number;
  readonly telephonyReadinessFailureCount: number;
};

const emptyEvidence: TelemetryEvidenceSummary = {
  apiRequestCount: 0,
  averageApiLatencyMs: 0,
  cardActionCount: 0,
  cardViewCount: 0,
  configurationErrorCount: 0,
  errorCount: 0,
  safetyGateBlockCount: 0,
  telephonyReadinessFailureCount: 0
};

function severityFor(value: number, medium: number, high: number): ImprovementSeverity {
  if (value >= high) {
    return "high";
  }

  if (value >= medium) {
    return "medium";
  }

  return "low";
}

function opportunity(
  input: Omit<ImprovementOpportunity, "status"> & {
    readonly status?: ImprovementOpportunity["status"];
  }
): ImprovementOpportunity {
  return {
    ...input,
    status: input.status ?? "detected"
  };
}

export function detectImprovementOpportunities(
  evidence: Partial<TelemetryEvidenceSummary>
): readonly ImprovementOpportunity[] {
  const data = { ...emptyEvidence, ...evidence };
  const opportunities: ImprovementOpportunity[] = [];

  if (data.apiRequestCount >= 5 && data.averageApiLatencyMs > 750) {
    opportunities.push(
      opportunity({
        baselineValue: data.averageApiLatencyMs,
        evidenceSummary: `Average API latency is ${Math.round(
          data.averageApiLatencyMs
        )}ms across ${data.apiRequestCount} measured requests.`,
        opportunityType: "performance",
        reasonCodes: [improvementReasonCodes.highApiLatency],
        severity: severityFor(data.averageApiLatencyMs, 900, 1500),
        sourceMetric: "api_latency_ms",
        subsystem: "system"
      })
    );
  }

  if (data.safetyGateBlockCount >= 3) {
    opportunities.push(
      opportunity({
        baselineValue: data.safetyGateBlockCount,
        evidenceSummary: `${data.safetyGateBlockCount} safety gate blocks were recorded. Review blocked reasons before enabling new runtime behavior.`,
        opportunityType: "safety_gate",
        reasonCodes: [improvementReasonCodes.repeatedSafetyGateBlocks],
        severity: severityFor(data.safetyGateBlockCount, 5, 10),
        sourceMetric: "safety_gate_blocks",
        subsystem: "security"
      })
    );
  }

  if (data.errorCount >= 3) {
    opportunities.push(
      opportunity({
        baselineValue: data.errorCount,
        evidenceSummary: `${data.errorCount} normalized error telemetry records were detected.`,
        opportunityType: "reliability",
        reasonCodes: [improvementReasonCodes.highErrorRate],
        severity: severityFor(data.errorCount, 8, 20),
        sourceMetric: "telemetry_error_events",
        subsystem: "system"
      })
    );
  }

  if (data.cardViewCount >= 20) {
    const conversionRate = data.cardActionCount / data.cardViewCount;

    if (conversionRate < 0.08) {
      opportunities.push(
        opportunity({
          baselineValue: Number(conversionRate.toFixed(4)),
          evidenceSummary: `${data.cardViewCount} card views produced ${data.cardActionCount} action events. The observed action conversion is ${Math.round(
            conversionRate * 100
          )}%.`,
          opportunityType: "conversion",
          reasonCodes: [improvementReasonCodes.lowCardActionConversion],
          severity: conversionRate < 0.03 ? "high" : "medium",
          sourceMetric: "card_action_conversion",
          subsystem: "card"
        })
      );
    }
  }

  if (data.configurationErrorCount >= 2) {
    opportunities.push(
      opportunity({
        baselineValue: data.configurationErrorCount,
        evidenceSummary: `${data.configurationErrorCount} configuration-related errors suggest documentation or environment setup needs clarification.`,
        opportunityType: "documentation",
        reasonCodes: [improvementReasonCodes.configurationMisuse],
        severity: "medium",
        sourceMetric: "configuration_error_count",
        subsystem: "documentation"
      })
    );
  }

  if (data.telephonyReadinessFailureCount >= 2) {
    opportunities.push(
      opportunity({
        baselineValue: data.telephonyReadinessFailureCount,
        evidenceSummary: `${data.telephonyReadinessFailureCount} telephony readiness failures were recorded. Keep provider activation blocked while improving setup clarity.`,
        opportunityType: "telephony_readiness",
        reasonCodes: [
          improvementReasonCodes.repeatedSafetyGateBlocks,
          improvementReasonCodes.voiceOrTelephonyRisk
        ],
        severity: "high",
        sourceMetric: "telephony_readiness_failures",
        subsystem: "telephony"
      })
    );
  }

  return opportunities.sort((a, b) => b.baselineValue - a.baselineValue);
}

export function normalizeSubsystem(value: string): ImprovementSubsystem {
  const allowed: readonly ImprovementSubsystem[] = [
    "card",
    "contact_graph",
    "dashboard",
    "database",
    "design_system",
    "documentation",
    "event_ledger",
    "intent_scoring",
    "provider_readiness",
    "receptionist",
    "security",
    "system",
    "telephony"
  ];

  return allowed.includes(value as ImprovementSubsystem)
    ? (value as ImprovementSubsystem)
    : "system";
}

export function uniqueReasonCodes(
  reasonCodes: readonly ImprovementReasonCode[]
): readonly ImprovementReasonCode[] {
  return Array.from(new Set(reasonCodes));
}
