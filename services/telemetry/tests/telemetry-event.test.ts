import { describe, expect, it } from "vitest";
import { getOrCreateCorrelationId } from "@bidayax/config";
import { createTelemetryEvent } from "../src/telemetry-event";

describe("telemetry events", () => {
  it("creates a privacy-safe telemetry event", () => {
    const event = createTelemetryEvent({
      eventName: "api_request_completed",
      metadata: { apiKey: "redacted-test-key", route: "/api/system/health" },
      status: "success",
      subsystem: "system"
    });

    expect(event.severity).toBe("info");
    expect(event.metadata.apiKey).toBe("[redacted]");
    expect(event.createdAt).toBeTruthy();
  });

  it("generates correlation ids without using identity", () => {
    const id = getOrCreateCorrelationId();

    expect(id).toMatch(/^corr_/);
  });
});
