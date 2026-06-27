export const defaultTelemetryRetentionPolicy = {
  telemetryErrorEventsDays: 180,
  telemetryEventsDays: 90,
  telemetryMetricsDays: 180,
  telemetrySafetyGateEventsDays: 365
} as const;

