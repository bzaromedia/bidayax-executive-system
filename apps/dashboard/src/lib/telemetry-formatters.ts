import type {
  TelemetrySafetyGateDecision,
  TelemetrySeverity,
  TelemetryStatus,
  TelemetrySubsystem
} from "@bidayax/types";

export const telemetrySubsystemLabels = {
  card: "Card",
  contact_graph: "Contact graph",
  dashboard: "Dashboard",
  database: "Database",
  event_ledger: "Event ledger",
  improvement_engine: "Improvement engine",
  intent_scoring: "Intent scoring",
  provider_readiness: "Provider readiness",
  receptionist: "Receptionist",
  security: "Security",
  system: "System",
  telephony: "Telephony"
} as const satisfies Record<TelemetrySubsystem, string>;

export const telemetrySeverityLabels = {
  critical: "Critical",
  debug: "Debug",
  error: "Error",
  info: "Info",
  warning: "Warning"
} as const satisfies Record<TelemetrySeverity, string>;

export const telemetryStatusLabels = {
  blocked: "Blocked",
  degraded: "Degraded",
  failure: "Failure",
  skipped: "Skipped",
  success: "Success"
} as const satisfies Record<TelemetryStatus, string>;

export const telemetrySafetyGateDecisionLabels = {
  allowed: "Allowed",
  blocked: "Blocked",
  skipped: "Skipped",
  warning: "Warning"
} as const satisfies Record<TelemetrySafetyGateDecision, string>;

export function formatMetricValue(value: number, unit: string) {
  if (unit === "milliseconds") {
    return `${Math.round(value)} ms`;
  }

  if (unit === "count") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value)} ${unit}`;
}
