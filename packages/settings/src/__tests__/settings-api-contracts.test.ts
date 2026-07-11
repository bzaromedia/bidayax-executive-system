import { describe, expect, it } from "vitest";
import {
  assertValidSettingsSlug,
  createSettingsRequestId,
  normalizeIdempotencyKey,
  parseSettingsPagination,
  settingsApiError,
  settingsApiSuccess
} from "../settings-api-contracts";

describe("settings API contracts", () => {
  it("validates URL-safe slugs", () => {
    expect(assertValidSettingsSlug("ad-garner")).toBe("ad-garner");
    expect(() => assertValidSettingsSlug("../admin")).toThrow(/slug/);
  });

  it("normalizes request identifiers deterministically", () => {
    expect(createSettingsRequestId("Tenant A / Card 1")).toBe("settings-api-tenant-a-card-1");
  });

  it("caps pagination limits", () => {
    expect(parseSettingsPagination({ limit: "500" })).toEqual({
      cursor: null,
      limit: 100
    });
  });

  it("requires sufficiently strong idempotency keys", () => {
    expect(normalizeIdempotencyKey("publish-request-001")).toBe("publish-request-001");
    expect(() => normalizeIdempotencyKey("short")).toThrow(/Idempotency/);
  });

  it("returns typed success and failure envelopes", () => {
    expect(settingsApiSuccess({ data: { status: "ok" }, requestId: "req-1" }).ok).toBe(true);
    expect(settingsApiError("not_found", "Missing", "req-2").error.code).toBe("not_found");
  });
});
