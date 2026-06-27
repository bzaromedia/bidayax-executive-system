import type { TelemetryMetric, TelemetryMetricInput } from "@bidayax/types";
import { sanitizeMetadata } from "./telemetry-sanitizer";

export function createTelemetryMetric(input: TelemetryMetricInput): TelemetryMetric {
  return {
    dimensions: sanitizeMetadata(input.dimensions),
    measuredAt: input.measuredAt ?? new Date().toISOString(),
    metricName: input.metricName,
    metricUnit: input.metricUnit,
    metricValue: input.metricValue,
    subsystem: input.subsystem
  };
}

