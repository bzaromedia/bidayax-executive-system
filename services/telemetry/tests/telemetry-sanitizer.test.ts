import { describe, expect, it } from "vitest";
import { sanitizeMetadata } from "../src/telemetry-sanitizer";

describe("telemetry sanitizer", () => {
  it("redacts secrets and masks phone numbers", () => {
    const sanitized = sanitizeMetadata({
      nested: { authToken: "secret" },
      phoneNumber: "+15551234567",
      token: "Bearer hidden"
    });

    expect(sanitized.token).toBe("[redacted]");
    expect(sanitized.phoneNumber).toBe("***-***-4567");
    expect((sanitized.nested as Record<string, unknown>).authToken).toBe(
      "[redacted]"
    );
  });
});

