import type { ExecutiveSlug } from "./events";

export const telemetrySubsystems = [
  "card",
  "dashboard",
  "event_ledger",
  "intent_scoring",
  "contact_graph",
  "receptionist",
  "telephony",
  "provider_readiness",
  "improvement_engine",
  "system",
  "database",
  "security"
] as const;

export type TelemetrySubsystem = (typeof telemetrySubsystems)[number];

export const telemetrySeverities = [
  "debug",
  "info",
  "warning",
  "error",
  "critical"
] as const;

export type TelemetrySeverity = (typeof telemetrySeverities)[number];

export const telemetryStatuses = [
  "success",
  "failure",
  "blocked",
  "degraded",
  "skipped"
] as const;

export type TelemetryStatus = (typeof telemetryStatuses)[number];

export const telemetrySafetyGateDecisions = [
  "allowed",
  "blocked",
  "warning",
  "skipped"
] as const;

export type TelemetrySafetyGateDecision =
  (typeof telemetrySafetyGateDecisions)[number];

export type TelemetryMetadata = Readonly<Record<string, unknown>>;

export type TelemetryEventInput = {
  readonly eventName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly severity?: TelemetrySeverity;
  readonly status: TelemetryStatus;
  readonly correlationId?: string | null;
  readonly sessionId?: string | null;
  readonly anonymousVisitorId?: string | null;
  readonly executiveSlug?: ExecutiveSlug | null;
  readonly durationMs?: number | null;
  readonly metadata?: TelemetryMetadata;
};

export type TelemetryEvent = Required<
  Pick<TelemetryEventInput, "eventName" | "subsystem" | "status">
> & {
  readonly severity: TelemetrySeverity;
  readonly correlationId: string | null;
  readonly sessionId: string | null;
  readonly anonymousVisitorId: string | null;
  readonly executiveSlug: ExecutiveSlug | null;
  readonly durationMs: number | null;
  readonly metadata: TelemetryMetadata;
  readonly createdAt: string;
};

export type TelemetryMetricInput = {
  readonly metricName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly metricValue: number;
  readonly metricUnit: string;
  readonly dimensions?: TelemetryMetadata;
  readonly measuredAt?: string | null;
};

export type TelemetryMetric = Required<
  Pick<TelemetryMetricInput, "metricName" | "subsystem" | "metricValue" | "metricUnit">
> & {
  readonly dimensions: TelemetryMetadata;
  readonly measuredAt: string;
};

export type TelemetryErrorInput = {
  readonly subsystem: TelemetrySubsystem;
  readonly errorCode: string;
  readonly errorCategory: string;
  readonly severity?: TelemetrySeverity;
  readonly safeMessage: string;
  readonly correlationId?: string | null;
  readonly metadata?: TelemetryMetadata;
};

export type TelemetryErrorEvent = Required<
  Pick<TelemetryErrorInput, "subsystem" | "errorCode" | "errorCategory" | "safeMessage">
> & {
  readonly severity: TelemetrySeverity;
  readonly correlationId: string | null;
  readonly metadata: TelemetryMetadata;
  readonly createdAt: string;
};

export type TelemetrySafetyGateInput = {
  readonly gateName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly decision: TelemetrySafetyGateDecision;
  readonly reasonCodes: readonly string[];
  readonly correlationId?: string | null;
  readonly metadata?: TelemetryMetadata;
};

export type TelemetrySafetyGateEvent = Required<
  Pick<TelemetrySafetyGateInput, "gateName" | "subsystem" | "decision" | "reasonCodes">
> & {
  readonly correlationId: string | null;
  readonly metadata: TelemetryMetadata;
  readonly createdAt: string;
};

export type TelemetryRetentionPolicy = {
  readonly telemetryEventsDays: number;
  readonly telemetryMetricsDays: number;
  readonly telemetryErrorEventsDays: number;
  readonly telemetrySafetyGateEventsDays: number;
};

export type TelemetryAggregateSummary = {
  readonly totalEvents: number;
  readonly totalMetrics: number;
  readonly totalErrors: number;
  readonly totalSafetyGateEvents: number;
  readonly eventsBySubsystem: Readonly<Record<string, number>>;
  readonly errorsBySubsystem: Readonly<Record<string, number>>;
  readonly safetyGateBlocksByReasonCode: Readonly<Record<string, number>>;
  readonly averageMetrics: Readonly<Record<string, number>>;
};

export function isTelemetrySubsystem(value: string): value is TelemetrySubsystem {
  return (telemetrySubsystems as readonly string[]).includes(value);
}

export function isTelemetrySeverity(value: string): value is TelemetrySeverity {
  return (telemetrySeverities as readonly string[]).includes(value);
}

export function isTelemetryStatus(value: string): value is TelemetryStatus {
  return (telemetryStatuses as readonly string[]).includes(value);
}
