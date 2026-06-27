import { describe, expect, it } from "vitest";
import { aggregateTelemetry } from "../src/telemetry-aggregator";
import { createTelemetryEvent } from "../src/telemetry-event";
import { createTelemetryMetric } from "../src/telemetry-metric";
import { createTelemetryError } from "../src/telemetry-error";
import { createTelemetrySafetyGateEvent } from "../src/telemetry-safety-gate";

describe("telemetry aggregator", () => {
  it("aggregates telemetry deterministically", () => {
    const summary = aggregateTelemetry({
      errors: [
        createTelemetryError({
          errorCategory: "query",
          errorCode: "DATABASE_QUERY_FAILED",
          safeMessage: "Query failed.",
          subsystem: "database"
        })
      ],
      events: [
        createTelemetryEvent({
          eventName: "dashboard_viewed",
          status: "success",
          subsystem: "dashboard"
        })
      ],
      metrics: [
        createTelemetryMetric({
          metricName: "api_latency_ms",
          metricUnit: "milliseconds",
          metricValue: 20,
          subsystem: "dashboard"
        }),
        createTelemetryMetric({
          metricName: "api_latency_ms",
          metricUnit: "milliseconds",
          metricValue: 40,
          subsystem: "dashboard"
        })
      ],
      safetyGateEvents: [
        createTelemetrySafetyGateEvent({
          decision: "blocked",
          gateName: "production_voice",
          reasonCodes: ["TEST_MODE_ENABLED"],
          subsystem: "telephony"
        })
      ]
    });

    expect(summary.totalEvents).toBe(1);
    expect(summary.errorsBySubsystem.database).toBe(1);
    expect(summary.averageMetrics.api_latency_ms).toBe(30);
    expect(summary.safetyGateBlocksByReasonCode.TEST_MODE_ENABLED).toBe(1);
  });

  it("handles empty telemetry data", () => {
    const summary = aggregateTelemetry({});

    expect(summary.totalEvents).toBe(0);
    expect(summary.totalErrors).toBe(0);
  });
});

