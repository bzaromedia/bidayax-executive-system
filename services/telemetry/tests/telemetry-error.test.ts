import { describe, expect, it } from "vitest";
import { createTelemetryError } from "../src/telemetry-error";

describe("telemetry errors", () => {
  it("sanitizes error metadata", () => {
    const error = createTelemetryError({
      errorCategory: "database",
      errorCode: "DATABASE_QUERY_FAILED",
      metadata: { password: "do-not-store", queryName: "summary" },
      safeMessage: "Database query failed safely.",
      subsystem: "database"
    });

    expect(error.metadata.password).toBe("[redacted]");
    expect(error.safeMessage).not.toContain("do-not-store");
  });
});

