import { describe, expect, it } from "vitest";
import { createTelemetrySafetyGateEvent } from "../src/telemetry-safety-gate";

describe("telemetry safety gates", () => {
  it("creates blocked safety gate telemetry", () => {
    const event = createTelemetrySafetyGateEvent({
      decision: "blocked",
      gateName: "production_voice",
      reasonCodes: ["TEST_MODE_ENABLED"],
      subsystem: "telephony"
    });

    expect(event.decision).toBe("blocked");
    expect(event.reasonCodes).toContain("TEST_MODE_ENABLED");
  });
});

