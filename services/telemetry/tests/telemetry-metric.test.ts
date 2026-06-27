import { describe, expect, it } from "vitest";
import { createTelemetryMetric } from "../src/telemetry-metric";

describe("telemetry metrics", () => {
  it("creates a metric snapshot", () => {
    const metric = createTelemetryMetric({
      dimensions: { route: "/observability" },
      metricName: "api_latency_ms",
      metricUnit: "milliseconds",
      metricValue: 42,
      subsystem: "dashboard"
    });

    expect(metric.metricValue).toBe(42);
    expect(metric.measuredAt).toBeTruthy();
  });
});

