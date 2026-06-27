import type {
  TelemetryErrorInput,
  TelemetryEventInput,
  TelemetryMetricInput,
  TelemetrySafetyGateInput
} from "@bidayax/types";
import { createLogger } from "./logger";

const log = createLogger({ component: "telemetry-config" });

export function logTelemetryEvent(event: TelemetryEventInput) {
  log(event.status === "failure" ? "warn" : "info", "telemetry_event_recorded", {
    eventName: event.eventName,
    status: event.status,
    subsystem: event.subsystem
  });
}

export function logTelemetryMetric(metric: TelemetryMetricInput) {
  log("info", "telemetry_metric_recorded", {
    metricName: metric.metricName,
    subsystem: metric.subsystem,
    unit: metric.metricUnit
  });
}

export function logTelemetryError(error: TelemetryErrorInput) {
  log(error.severity === "critical" ? "error" : "warn", "telemetry_error_recorded", {
    errorCategory: error.errorCategory,
    errorCode: error.errorCode,
    subsystem: error.subsystem
  });
}

export function logTelemetrySafetyGate(event: TelemetrySafetyGateInput) {
  log(event.decision === "blocked" ? "warn" : "info", "telemetry_safety_gate_recorded", {
    decision: event.decision,
    gateName: event.gateName,
    subsystem: event.subsystem
  });
}

