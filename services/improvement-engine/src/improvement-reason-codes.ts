import type { ImprovementReasonCode } from "@bidayax/types";

export const improvementReasonCodes = {
  configurationMisuse: "CONFIGURATION_MISUSE",
  databaseRisk: "DATABASE_RISK",
  highApiLatency: "HIGH_API_LATENCY",
  highErrorRate: "HIGH_ERROR_RATE",
  humanApprovalRequired: "HUMAN_APPROVAL_REQUIRED",
  lowCardActionConversion: "LOW_CARD_ACTION_CONVERSION",
  noFakeMetricsAllowed: "NO_FAKE_METRICS_ALLOWED",
  repeatedSafetyGateBlocks: "REPEATED_SAFETY_GATE_BLOCKS",
  rollbackRequired: "ROLLBACK_REQUIRED",
  sandboxRequired: "SANDBOX_REQUIRED",
  securityRisk: "SECURITY_RISK",
  telemetryEvidenceRequired: "TELEMETRY_EVIDENCE_REQUIRED",
  voiceOrTelephonyRisk: "VOICE_OR_TELEPHONY_RISK"
} as const satisfies Record<string, ImprovementReasonCode>;
