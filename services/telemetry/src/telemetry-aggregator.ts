import type {
  TelemetryAggregateSummary,
  TelemetryErrorEvent,
  TelemetryEvent,
  TelemetryMetric,
  TelemetrySafetyGateEvent
} from "@bidayax/types";

function increment(target: Record<string, number>, key: string, amount = 1) {
  target[key] = (target[key] ?? 0) + amount;
}

export function aggregateTelemetry({
  errors = [],
  events = [],
  metrics = [],
  safetyGateEvents = []
}: {
  readonly errors?: readonly TelemetryErrorEvent[];
  readonly events?: readonly TelemetryEvent[];
  readonly metrics?: readonly TelemetryMetric[];
  readonly safetyGateEvents?: readonly TelemetrySafetyGateEvent[];
}): TelemetryAggregateSummary {
  const eventsBySubsystem: Record<string, number> = {};
  const errorsBySubsystem: Record<string, number> = {};
  const safetyGateBlocksByReasonCode: Record<string, number> = {};
  const metricSums: Record<string, number> = {};
  const metricCounts: Record<string, number> = {};

  events.forEach((event) => increment(eventsBySubsystem, event.subsystem));
  errors.forEach((error) => increment(errorsBySubsystem, error.subsystem));
  safetyGateEvents
    .filter((event) => event.decision === "blocked")
    .forEach((event) => {
      event.reasonCodes.forEach((reasonCode) =>
        increment(safetyGateBlocksByReasonCode, reasonCode)
      );
    });
  metrics.forEach((metric) => {
    increment(metricSums, metric.metricName, metric.metricValue);
    increment(metricCounts, metric.metricName);
  });

  const averageMetrics = Object.fromEntries(
    Object.entries(metricSums).map(([metricName, sum]) => [
      metricName,
      sum / (metricCounts[metricName] ?? 1)
    ])
  );

  return {
    averageMetrics,
    errorsBySubsystem,
    eventsBySubsystem,
    safetyGateBlocksByReasonCode,
    totalErrors: errors.length,
    totalEvents: events.length,
    totalMetrics: metrics.length,
    totalSafetyGateEvents: safetyGateEvents.length
  };
}

